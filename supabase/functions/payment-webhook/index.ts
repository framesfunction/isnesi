import { checkStatus, readMoMoConfig } from "../_shared/momo.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";
import { timingSafeEqual } from "../_shared/timing-safe.ts";

/**
 * payment-webhook
 *
 * Callers: the payment provider (MTN MoMo callback delivery), gated by a
 * shared secret header (`x-webhook-secret` === PAYMENT_WEBHOOK_SECRET).
 *
 * Provider callbacks carry no signature by themselves, so the payload is never
 * trusted: every event is re-verified by querying the provider's requesttopay
 * status endpoint directly. Idempotency is enforced by the
 * `payment_events(provider_key, provider_event_id)` unique constraint.
 *
 * A verified SUCCESSFUL status is what issues a receipt number — never a
 * redirect, never the caller's claim.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function receiptNumber(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `RCP-${new Date().getUTCFullYear()}-${suffix.toUpperCase()}`;
}

const MOMO_TO_PAYMENT_STATUS: Record<string, "succeeded" | "failed" | "pending"> = {
  SUCCESSFUL: "succeeded",
  FAILED: "failed",
  REJECTED: "failed",
  TIMEOUT: "failed",
  PENDING: "pending",
  UNKNOWN: "pending",
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET") ?? "";
  const presented = request.headers.get("x-webhook-secret") ?? "";
  if (!secret || !timingSafeEqual(secret, presented)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { donationReferenceId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const referenceId = typeof body.donationReferenceId === "string" ? body.donationReferenceId : "";
  if (!UUID_RE.test(referenceId)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const config = readMoMoConfig(Deno.env);
  if (!config) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Never trust the payload — verify with the provider.
  const verified = await checkStatus(config, referenceId);
  if (!verified.ok) {
    return Response.json({ error: "Verification failed" }, { status: 502 });
  }
  const donationStatus = MOMO_TO_PAYMENT_STATUS[verified.status] ?? "pending";

  const donationResult = await serviceRequest(
    `/rest/v1/donations?id=eq.${referenceId}&select=id,payment_status,provider_key,receipt_number,currency,amount_minor`,
  );
  if (!donationResult.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const rows = (donationResult.data as Array<Record<string, unknown>>) ?? [];
  const donation = rows[0];
  if (!donation) {
    return Response.json({ error: "Donation not found" }, { status: 404 });
  }

  // Idempotent event record (unique on provider_key + provider_event_id).
  const eventId = `callback:${referenceId}:${verified.status}`;
  const eventInsert = await serviceRequest("/rest/v1/payment_events", {
    method: "POST",
    headers: { prefer: "resolution=ignore-duplicates" },
    body: {
      donation_id: donation.id,
      provider_key: "mtn_momo",
      provider_event_id: eventId,
      event_type: verified.status.toLowerCase(),
      signature_valid: true,
      payload: { verified_status: verified.status },
    },
  });
  if (!eventInsert.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (donationStatus === "pending" || donation.payment_status === "succeeded") {
    // Nothing to transition, or already terminal.
    return Response.json({ ok: true, status: donation.payment_status });
  }

  const patch: Record<string, unknown> = {
    payment_status: donationStatus,
    paid_at: donationStatus === "succeeded" ? new Date().toISOString() : null,
  };
  if (donationStatus === "succeeded" && !donation.receipt_number) {
    patch.receipt_number = receiptNumber();
  }

  const updated = await serviceRequest(`/rest/v1/donations?id=eq.${donation.id}`, {
    method: "PATCH",
    body: patch,
  });
  if (!updated.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, status: donationStatus });
});
