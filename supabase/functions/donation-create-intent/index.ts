Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const providerAdapterUrl = Deno.env.get("PAYMENT_PROVIDER_ADAPTER_URL");
  if (!providerAdapterUrl) {
    return Response.json({ error: "Payment provider not configured" }, { status: 503 });
  }

  let body: { amountMinor?: unknown; currency?: unknown; donationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.amountMinor !== "number" || !Number.isSafeInteger(body.amountMinor) ||
      body.amountMinor <= 0 || typeof body.currency !== "string" ||
      !/^[A-Z]{3}$/.test(body.currency) || typeof body.donationId !== "string") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const response = await fetch(providerAdapterUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${Deno.env.get("PAYMENT_PROVIDER_ADAPTER_TOKEN") ?? ""}`,
    },
    body: JSON.stringify({
      amountMinor: body.amountMinor,
      currency: body.currency,
      reference: body.donationId,
    }),
  });
  if (!response.ok) return Response.json({ error: "Provider unavailable" }, { status: 502 });
  const result = await response.json() as { providerReference?: unknown };
  if (typeof result.providerReference !== "string") {
    return Response.json({ error: "Invalid provider response" }, { status: 502 });
  }
  return Response.json({
    providerReference: result.providerReference,
    donationId: body.donationId,
  });
});
