Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });

  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const eventId = request.headers.get("x-provider-event-id") ?? "";
  const providerKey = request.headers.get("x-provider-key") ?? "generic";
  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET") ?? "";
  if (!secret || !eventId || !signature) {
    return Response.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const expected = Uint8Array.from(
    signature.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    expected,
    new TextEncoder().encode(raw),
  );
  if (!valid) return Response.json({ error: "Invalid signature" }, { status: 401 });

  let payload: {
    donationId?: unknown;
    providerTransactionId?: unknown;
    eventType?: unknown;
    status?: unknown;
  };
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "resolution=ignore-duplicates,return=minimal",
  };

  const exists = await fetch(
    `${supabaseUrl}/rest/v1/payment_events?provider_key=eq.${encodeURIComponent(providerKey)}&provider_event_id=eq.${encodeURIComponent(eventId)}&select=id`,
    { headers },
  );
  const existingEvents = await exists.json();
  if (Array.isArray(existingEvents) && existingEvents.length > 0) {
    return Response.json({ ok: true, duplicate: true });
  }

  const allowedStatuses = ["created", "pending", "succeeded", "failed", "cancelled", "refunded", "partially_refunded"];
  if (typeof payload.donationId !== "string" ||
      typeof payload.providerTransactionId !== "string" ||
      typeof payload.status !== "string" ||
      !allowedStatuses.includes(payload.status) ||
      typeof payload.eventType !== "string") {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventInsert = await fetch(`${supabaseUrl}/rest/v1/payment_events`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      donation_id: payload.donationId,
      provider_key: providerKey,
      provider_event_id: eventId,
      event_type: payload.eventType,
      signature_valid: true,
      payload: {},
    }),
  });
  if (!eventInsert.ok) return Response.json({ error: "Webhook storage failed" }, { status: 503 });

  const donationUpdate = await fetch(`${supabaseUrl}/rest/v1/donations?id=eq.${payload.donationId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      provider_key: providerKey,
      provider_transaction_id: payload.providerTransactionId,
      payment_status: payload.status,
      paid_at: payload.status === "succeeded" ? new Date().toISOString() : null,
      receipt_number: payload.status === "succeeded"
        ? `RCPT-${payload.providerTransactionId.slice(-12)}`
        : null,
    }),
  });
  if (!donationUpdate.ok) return Response.json({ error: "Donation update failed" }, { status: 503 });

  await fetch(`${supabaseUrl}/rest/v1/payment_events?provider_key=eq.${encodeURIComponent(providerKey)}&provider_event_id=eq.${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ donation_id: payload.donationId, processed_at: new Date().toISOString() }),
  });
  return Response.json({ ok: true, duplicate: false });
});
