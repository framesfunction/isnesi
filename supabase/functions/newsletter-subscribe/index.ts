import { clientIp, enforceRateLimit } from "../_shared/caller.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

function makeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = clientIp(request);
  const limited = await enforceRateLimit(`newsletter:subscribe:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!limited.ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { email?: unknown; fullName?: unknown; consent?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ||
    body.email.length > 254 ||
    (body.fullName !== undefined && (typeof body.fullName !== "string" || body.fullName.length > 120)) ||
    body.consent !== true ||
    (body.locale !== undefined && (typeof body.locale !== "string" || body.locale.length > 10))
  ) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email.toLowerCase();
  const locale = (body.locale || "en").slice(0, 10);
  const token = makeToken();

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Check for an existing subscriber.
  const existing = await serviceRequest(
    `/rest/v1/newsletter_subscribers?email=eq.${encodeURIComponent(email)}&select=id,status`,
  );
  if (!existing.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const rows = (existing.data as Array<Record<string, unknown>>) ?? [];
  const existingRow = rows[0];

  if (existingRow) {
    const currentStatus = existingRow.status as string;
    if (currentStatus === "subscribed" || currentStatus === "pending") {
      return Response.json({
        ok: true,
        alreadySubscribed: currentStatus === "subscribed",
        message: currentStatus === "subscribed"
          ? "You are already on our newsletter list."
          : "A confirmation email has already been sent. Please check your inbox.",
      });
    }

    // Reactivate an unsubscribed/suppressed subscriber as pending.
    const updated = await serviceRequest(
      `/rest/v1/newsletter_subscribers?id=eq.${existingRow.id}`,
      {
        method: "PATCH",
        body: {
          status: "pending",
          full_name: body.fullName || null,
          locale,
        },
      },
    );
    if (!updated.ok) {
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }

    await serviceRequest("/rest/v1/newsletter_consents", {
      method: "POST",
      body: {
        subscriber_id: existingRow.id,
        status: "granted",
        source: "website",
        policy_version: "1.0",
        evidence_reference: `confirm:${token}`,
      },
    });

    return Response.json({
      ok: true,
      alreadySubscribed: false,
      message: "Thank you. Please confirm your subscription by email.",
    });
  }

  // Create a new pending subscriber.
  const created = await serviceRequest("/rest/v1/newsletter_subscribers", {
    method: "POST",
    body: {
      email,
      full_name: body.fullName || null,
      locale,
      status: "pending",
    },
  });
  if (!created.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  const newRow = (created.data as Array<Record<string, unknown>>)?.[0] as
    | { id: string }
    | undefined;
  if (!newRow) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  await serviceRequest("/rest/v1/newsletter_consents", {
    method: "POST",
    body: {
      subscriber_id: newRow.id,
      status: "granted",
      source: "website",
      policy_version: "1.0",
      evidence_reference: `confirm:${token}`,
    },
  });

  return Response.json({
    ok: true,
    alreadySubscribed: false,
    message: "Thank you. Please confirm your subscription by email.",
  });
});
