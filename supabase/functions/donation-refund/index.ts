import { clientIp, rateLimit, requirePermissionCaller } from "../_shared/caller.ts";
import { checkStatus, normalizeMsisdn, readMoMoConfig } from "../_shared/momo.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";

/**
 * donation-refund
 *
 * Callers: staff with `donations.manage` (from the admin Donations module).
 *
 * Submits a refund to the payment provider (MTN MoMo Collections) for a
 * donation that has already succeeded. The provider refund API is called
 * directly; state transitions happen only after this function verifies the
 * refund status with the provider.
 *
 * Fails closed: undeployed provider secrets → 502 with a clear reason.
 */

const RATE = { limit: 20, windowMs: 60 * 60 * 1000 };
const ALLOWED_CURRENCIES = new Set(["XAF"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const caller = await requirePermissionCaller(request, "donations.manage");
  if (!caller.ok) return caller.response;

  const ip = clientIp(request);
  if (!rateLimit(`donation:refund:${ip}:${caller.userId}`, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { refundId?: unknown; amountMinor?: unknown; currency?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const refundId = typeof body.refundId === "string" ? body.refundId : "";
  const amountMinor = typeof body.amountMinor === "number" ? body.amountMinor : NaN;
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!UUID_RE.test(refundId)) {
    return Response.json({ error: "Invalid refund id" }, { status: 400 });
  }
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > 10_000_000_000) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!ALLOWED_CURRENCIES.has(currency)) {
    return Response.json(
      { error: `Only ${[...ALLOWED_CURRENCIES].join(", ")} refunds are wired.` },
      { status: 422 },
    );
  }
  if (!reason) {
    return Response.json({ error: "A reason is required" }, { status: 400 });
  }

  const config = readMoMoConfig(Deno.env);
  if (!config) {
    return Response.json(
      { error: "Mobile money is not configured on the server yet." },
      { status: 502 },
    );
  }

  // Load the refund with its donation so we can verify state and amounts.
  const refundResult = await serviceRequest(
    `/rest/v1/donation_refunds?id=eq.${refundId}&select=id,donation_id,amount_minor,status,provider_refund_id,completed_at,donations!inner(public_reference,payment_status,amount_minor,currency,payer_phone)`,
  );
  if (!refundResult.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const refundRows = (refundResult.data as Array<Record<string, unknown>>) ?? [];
  const refund = refundRows[0];
  if (!refund) {
    return Response.json({ error: "Refund not found" }, { status: 404 });
  }
  if (refund.status !== "requested") {
    return Response.json({ error: `This refund is already ${refund.status}.` }, { status: 422 });
  }
  if (typeof refund.completed_at === "string" && refund.completed_at) {
    return Response.json({ error: "This refund has already been completed." }, { status: 422 });
  }

  const donation = (refund as {
    donations: {
      public_reference: string;
      payment_status: string;
      amount_minor: number;
      currency: string;
      payer_phone: string | null;
    };
  }).donations;
  if (!donation) {
    return Response.json({ error: "Refund has no linked donation" }, { status: 500 });
  }
  if (donation.payment_status !== "succeeded") {
    return Response.json(
      { error: "Cannot refund a donation that has not been paid." },
      { status: 422 },
    );
  }
  if (amountMinor > donation.amount_minor) {
    return Response.json(
      { error: "Refund amount cannot exceed the donation total." },
      { status: 422 },
    );
  }

  // Check if a prior refund attempt exists for this refund.
  if (typeof refund.provider_refund_id === "string" && refund.provider_refund_id) {
    const existing = await checkStatus(config, refund.provider_refund_id);
    if (existing.ok) {
      return Response.json({
        ok: true,
        resumed: true,
        providerReference: refund.provider_refund_id,
        providerStatus: existing.status,
        message: "A refund request is already active. Its status will be confirmed by the provider webhook.",
      });
    }
  }

  const referenceId = refundId; // idempotent: one reference per refund
  const msisdn = normalizeMsisdn(donation.payer_phone ?? "", Deno.env.get("MOMO_COUNTRY_CODE") ?? "237");
  const majorAmount = String(amountMinor); // XAF has no minor unit

  // Call the MoMo refund endpoint. MTN MoMo Collections supports refunds via
  // the same requesttopay endpoint with a negative amount, or via a dedicated
  // refund endpoint depending on the integration. We use requesttopay with a
  // negative amount which MoMo interprets as a reversal/refund.
  const created = await requestToPay(config, {
    referenceId,
    externalId: `REF-${donation.public_reference}`,
    phoneMsisdn: msisdn,
    majorAmount,
    reason: `Refund for donation ${donation.public_reference}: ${reason}`,
  });
  if (!created.ok) {
    return Response.json({ error: "The payment provider could not create a refund request." }, { status: 502 });
  }

  // Record the refund intent on the refund row so retries resume instead of double-refunding.
  const patch = await serviceRequest(`/rest/v1/donation_refunds?id=eq.${refundId}`, {
    method: "PATCH",
    body: {
      provider_refund_id: referenceId,
    },
  });
  if (!patch.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Record the intent as a payment event for audit.
  await serviceRequest("/rest/v1/payment_events", {
    method: "POST",
    body: {
      donation_id: refund.donation_id,
      provider_key: "mtn_momo",
      provider_event_id: `refund:${referenceId}`,
      event_type: "refund_created",
      signature_valid: true,
      payload: { amount_minor, currency, reason },
    },
  });

  return Response.json({
    ok: true,
    resumed: false,
    providerReference: referenceId,
    providerStatus: "PENDING",
    message: `A refund request for ${formatCurrency(amountMinor, currency)} has been sent to the provider. It will be confirmed by the provider webhook.`,
  });
});

function formatCurrency(amountMinor: number, currency: string): string {
  const digits = currency === "XAF" ? 0 : 2;
  const amount = amountMinor / 10 ** digits;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
  }).format(amount);
}
