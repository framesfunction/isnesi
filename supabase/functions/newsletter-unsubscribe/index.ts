const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
const inMemoryBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): { ok: boolean } {
  const now = Date.now();
  const bucket = inMemoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { ok: true };
  }
  if (bucket.count >= RATE_LIMIT.limit) {
    return { ok: false };
  }
  bucket.count += 1;
  return { ok: true };
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const ip = clientIp(request);
  if (!rateLimit(`newsletter:unsubscribe:${ip}`).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { token?: unknown; email?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // One-click unsubscribe: token is required; email is optional for lookup.
  if (typeof body.token !== "string" || !body.token) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = body.token;
  const email = typeof body.email === "string" ? body.email.toLowerCase() : undefined;
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Find the subscriber. If an email is provided, match on both email and token
  // via the consent record; otherwise match on token alone.
  const query = `/rest/v1/newsletter_consents?evidence_reference=eq.confirm:${encodeURIComponent(token)}&select=subscriber_id&limit=1`;
  const consentResult = await serviceRequest(query);
  if (!consentResult.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const consentRows = (consentResult.data as Array<Record<string, unknown>>) ?? [];
  if (consentRows.length === 0) {
    return Response.json({ error: "Invalid or expired unsubscribe token." }, { status: 404 });
  }

  const subscriberId = consentRows[0].subscriber_id as string;

  // If an email was provided, verify it matches the subscriber.
  if (email) {
    const subscriberResult = await serviceRequest(
      `/rest/v1/newsletter_subscribers?id=eq.${subscriberId}&select=email`,
    );
    if (!subscriberResult.ok) {
      return Response.json({ error: "Service unavailable" }, { status: 503 });
    }
    const subscriberRows = (subscriberResult.data as Array<Record<string, unknown>>) ?? [];
    if (subscriberRows.length === 0 || subscriberRows[0].email !== email) {
      return Response.json({ error: "Invalid or expired unsubscribe token." }, { status: 404 });
    }
  }

  // Mark the subscriber as unsubscribed.
  const updated = await serviceRequest(
    `/rest/v1/newsletter_subscribers?id=eq.${subscriberId}`,
    {
      method: "PATCH",
      body: {
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      },
    },
  );
  if (!updated.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Record consent withdrawal.
  await serviceRequest("/rest/v1/newsletter_consents", {
    method: "POST",
    body: {
      subscriber_id: subscriberId,
      status: "withdrawn",
      source: "website_unsubscribe",
      policy_version: "1.0",
      evidence_reference: `unsubscribe:${token}`,
    },
  });

  return Response.json({
    ok: true,
    message: "You have been unsubscribed. You will no longer receive ISNESI emails.",
  });
});
