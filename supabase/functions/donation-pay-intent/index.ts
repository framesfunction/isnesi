import { clientIp, enforceRateLimit } from "../_shared/caller.ts";
import { checkStatus, normalizeMsisdn, readMoMoConfig, requestToPay } from "../_shared/momo.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";

/**
 * donation-pay-intent
 *
 * Callers: authenticated donors/staff paying for a specific `created`
 * donation. Requires a valid Supabase Auth bearer token — this is no longer a
 * public endpoint.
 *
 * Creates (or resumes) a provider payment intent for an existing `created`
 * donation. Provider: MTN MoMo Collections (requesttopay) — the payer approves
 * a prompt on their phone. The webhook never trusts caller payloads; state
 * transitions happen only after this function or `payment-webhook` verifies
 * the status directly with the provider.
 *
 * Rate-limited per IP and per donation. Fails closed: undeployed provider
 * secrets → 502 with a clear reason.
 */

const RATE = { limit: 10, windowMs: 60 * 60 * 1000 };
const ALLOWED_CURRENCIES = new Set(["XAF"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MSISDN_RE = /^[0-9+()\-\s]{6,20}$/;

async function requireAuthenticatedCaller(
  request: Request,
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, response: Response.json({ error: "Service unavailable" }, { status: 503 }) };
  }

  const userResult = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${token}`,
    },
  });
  if (!userResult.ok) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = (await userResult.json()) as { id?: string };
  if (!user.id) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, userId: user.id };
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const caller = await requireAuthenticatedCaller(request);
  if (!caller.ok) return caller.response;

  const ip = clientIp(request);
  if (!(await enforceRateLimit(`donation:pay:${ip}`, RATE.limit, RATE.windowMs)).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { donationId?: unknown; amountMinor?: unknown; currency?: unknown; payerPhone?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const donationId = typeof body.donationId === "string" ? body.donationId : "";
  const amountMinor = typeof body.amountMinor === "number" ? body.amountMinor : NaN;
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
  const payerPhone = typeof body.payerPhone === "string" ? body.payerPhone.trim() : "";

  if (!UUID_RE.test(donationId)) {
    return Response.json({ error: "Invalid donation id" }, { status: 400 });
  }
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > 10_000_000_000) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (!ALLOWED_CURRENCIES.has(currency)) {
    return Response.json(
      { error: `Only mobile money in ${[...ALLOWED_CURRENCIES].join(", ")} is supported.` },
      { status: 422 },
    );
  }
  if (!MSISDN_RE.test(payerPhone)) {
    return Response.json({ error: "A valid payer phone number is required" }, { status: 400 });
  }

  const config = readMoMoConfig(Deno.env);
  if (!config) {
    return Response.json(
      { error: "Mobile money is not configured on the server yet." },
      { status: 502 },
    );
  }

  // Load the donation. Only `created` donations may start (or resume) an intent.
  const donationResult = await serviceRequest(
    `/rest/v1/donations?id=eq.${donationId}&select=id,public_reference,payment_status,amount_minor,provider_key,provider_transaction_id,payer_phone`,
  );
  if (!donationResult.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const rows = (donationResult.data as Array<Record<string, unknown>>) ?? [];
  const donation = rows[0];
  if (!donation) {
    return Response.json({ error: "Donation not found" }, { status: 404 });
  }
  const status = donation.payment_status as string;
  if (status !== "created") {
    return Response.json({ error: `This donation is already ${status}.` }, { status: 422 });
  }

  // The amount must match the donation total exactly — no over/under-payment
  // through this endpoint.
  if (amountMinor !== (donation.amount_minor as number)) {
    return Response.json(
      { error: "Payment amount does not match the donation total." },
      { status: 422 },
    );
  }

  // If a previous attempt exists, check its status instead of overwriting the
  // payer phone or creating a duplicate request.
  const existingTxn = donation.provider_transaction_id as string | null;
  if (typeof existingTxn === "string" && existingTxn) {
    const existing = await checkStatus(config, existingTxn);
    if (existing.ok) {
      return Response.json({
        ok: true,
        resumed: true,
        providerReference: existingTxn,
        providerStatus: existing.status,
        message: "A payment request is already active for this donation. The donor approves it on their phone.",
      });
    }
  }

  // Per-donation rate limit so a single donation cannot be spammed.
  if (!(await enforceRateLimit(`donation:pay:donation:${donationId}`, RATE.limit, RATE.windowMs)).ok) {
    return Response.json({ error: "Too many attempts for this donation. Please try again later." }, { status: 429 });
  }

  const referenceId = donationId; // idempotent: one reference per donation
  const msisdn = normalizeMsisdn(payerPhone, Deno.env.get("MOMO_COUNTRY_CODE") ?? "237");
  const majorAmount = String(amountMinor); // XAF has no minor unit

  const created = await requestToPay(config, {
    referenceId,
    externalId: donation.public_reference as string,
    phoneMsisdn: msisdn,
    majorAmount,
    reason: "ISNESI donation",
  });
  if (!created.ok) {
    return Response.json({ error: "The payment provider could not create a payment request." }, { status: 502 });
  }

  // Record the intent on the donation so retries resume instead of double-charging.
  const patch = await serviceRequest(`/rest/v1/donations?id=eq.${donationId}`, {
    method: "PATCH",
    body: {
      provider_key: "mtn_momo",
      provider_transaction_id: referenceId,
      payer_phone: payerPhone,
    },
  });
  if (!patch.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  await serviceRequest("/rest/v1/payment_events", {
    method: "POST",
    body: {
      donation_id: donationId,
      provider_key: "mtn_momo",
      provider_event_id: `intent:${referenceId}`,
      event_type: "intent_created",
      signature_valid: true,
      payload: { amount_minor: amountMinor, currency },
    },
  });

  return Response.json({
    ok: true,
    resumed: false,
    providerReference: referenceId,
    providerStatus: "PENDING",
    message: "A payment prompt was sent to the donor's phone. It is confirmed by the provider webhook.",
  });
});
