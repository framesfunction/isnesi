import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * ISN-005: donation-pay-intent must be authenticated, amount-validated, and
 * per-donation rate-limited. The public version lets anyone retarget any
 * `created` donation to their phone and pay any amount.
 *
 * Test harness: Deno.serve is stubbed to capture the handler; fetch and
 * Deno.env are stubbed so the module loads in Node/vitest without Deno.
 */

type Handler = (request: Request) => Promise<Response>;
let capturedHandler: Handler | null = null;

function stubDeno(envImpl: (key: string) => string | undefined) {
  vi.stubGlobal(
    "Deno",
    {
      env: { get: envImpl },
      serve: (handler: (req: Request) => Response | Promise<Response>) => {
        capturedHandler = handler as Handler;
      },
    } as unknown,
  );
}

function stubFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", impl as unknown as typeof globalThis.fetch);
}

const baseUrl = "https://example.supabase.co";
const serviceRoleKey = "sb_secret_testkey";

const donationResponse = (body: unknown) =>
  new Response(JSON.stringify([body]), { status: 200 });

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

describe("ISN-005 donation-pay-intent authentication and amount validation", () => {
  beforeEach(() => {
    capturedHandler = null;
    stubFetch(async () => okResponse());
    stubDeno((envKey) => {
      if (envKey === "SUPABASE_URL") return baseUrl;
      if (envKey === "SUPABASE_SERVICE_ROLE_KEY") return serviceRoleKey;
      if (envKey === "MOMO_BASE_URL") return "https://momo.example.com";
      if (envKey === "MOMO_SUBSCRIPTION_KEY") return "sub-key";
      if (envKey === "MOMO_API_USER") return "api-user";
      if (envKey === "MOMO_API_KEY") return "api-key";
      if (envKey === "MOMO_TARGET_ENV") return "sandbox";
      if (envKey === "MOMO_CURRENCY") return "XAF";
      if (envKey === "MOMO_COUNTRY_CODE") return "237";
      return undefined;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    capturedHandler = null;
  });

  async function importHandler() {
    // resetModules clears the module cache so Deno.serve runs again with the
    // current global stubs (set in beforeEach / overridden per-test).
    vi.resetModules();
    await import("./donation-pay-intent/index.ts");
    if (!capturedHandler) throw new Error("Deno.serve handler was not captured");
    return capturedHandler;
  }

  function authRequest(body: unknown, token?: string) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    return new Request("https://x/functions/v1/donation-pay-intent", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  it("rejects requests with no Authorization header (401)", async () => {
    const handler = await importHandler();
    const res = await handler(
      new Request("https://x/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ donationId: "00000000-0000-0000-0000-000000000000", amountMinor: 1000, currency: "XAF", payerPhone: "+237600000000" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects requests with an invalid token (401)", async () => {
    stubFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
      }
      return okResponse();
    });
    const handler = await importHandler();
    const res = await handler(authRequest({ donationId: "00000000-0000-0000-0000-000000000000", amountMinor: 1000, currency: "XAF", payerPhone: "+237600000000" }, "bad-token"));
    expect(res.status).toBe(401);
  });

  it("rejects amount mismatch against donation total (422)", async () => {
    // Donation total is 5000, caller sends 1000
    stubFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
      if (url.includes("/donations")) {
        return donationResponse({ id: "00000000-0000-0000-0000-000000000000", amount_minor: 5000, payment_status: "created", public_reference: "DON-2026-000001" });
      }
      return okResponse();
    });
    const handler = await importHandler();
    const res = await handler(authRequest({ donationId: "00000000-0000-0000-0000-000000000000", amountMinor: 1000, currency: "XAF", payerPhone: "+237600000000" }, "valid-token"));
    expect(res.status).toBe(422);
  });

  it("accepts amount matching donation total (proceeds to provider)", async () => {
    let providerCalled = false;
    stubFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
      if (url.includes("/donations")) {
        return donationResponse({ id: "00000000-0000-0000-0000-000000000000", amount_minor: 1000, payment_status: "created", public_reference: "DON-2026-000001" });
      }
      if (url.includes("/collection/token/")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      if (url.includes("/requesttopay")) {
        providerCalled = true;
        return new Response("", { status: 200 });
      }
      return okResponse();
    });
    const handler = await importHandler();
    const res = await handler(authRequest({ donationId: "00000000-0000-0000-0000-000000000000", amountMinor: 1000, currency: "XAF", payerPhone: "+237600000000" }, "valid-token"));
    expect(res.status).toBe(200);
    expect(providerCalled).toBe(true);
  });

  it("does not overwrite an existing provider_transaction_id (resumes instead)", async () => {
    stubFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-123" }), { status: 200 });
      if (url.includes("/collection/token/")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
      if (url.includes("/donations")) {
        return donationResponse({ id: "00000000-0000-0000-0000-000000000000", amount_minor: 1000, payment_status: "created", public_reference: "DON-2026-000001", provider_transaction_id: "existing-txn" });
      }
      if (url.includes("/requesttopay/")) {
        return new Response(JSON.stringify({ status: "SUCCESSFUL" }), { status: 200 });
      }
      return okResponse();
    });
    const handler = await importHandler();
    const res = await handler(authRequest({ donationId: "00000000-0000-0000-0000-000000000000", amountMinor: 1000, currency: "XAF", payerPhone: "+237600000000" }, "valid-token"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.resumed).toBe(true);
  });
});
