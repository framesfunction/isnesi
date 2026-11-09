import { describe, expect, it, vi, afterEach } from "vitest";

/**
 * ISN-003 (Next.js side): enforceRateLimit uses the DB-backed
 * `app_private.consume_rate_limit` RPC when the privileged environment is
 * configured, and falls back to the per-instance in-memory bucket when the
 * RPC or env is unavailable. The request is never failed by the limiter.
 */

function mockFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", impl as unknown as typeof globalThis.fetch);
}

function envWithSupabase() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.CRON_SECRET = "cron-secret";
}

function envWithoutSupabase() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.CRON_SECRET;
}

afterEach(() => {
  vi.unstubAllGlobals();
  envWithoutSupabase();
});

describe("enforceRateLimit uses the DB-backed RPC when configured", () => {
  it("calls app_private.consume_rate_limit and honors an allowed result", async () => {
    let rpcBody: unknown = null;
    mockFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/rpc/consume_rate_limit")) {
        rpcBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify(true), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    envWithSupabase();

    const { enforceRateLimit } = await import("./distributed-rate-limit");
    const result = await enforceRateLimit("login:1.2.3.4", 5, 3_600_000);

    expect(result.ok).toBe(true);
    expect(rpcBody).toEqual({
      p_bucket_key: "login:1.2.3.4",
      p_limit: 5,
      p_window_seconds: 3600,
    });
  });

  it("returns ok=false when the RPC reports the bucket is exhausted", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      if (String(input).endsWith("/rpc/consume_rate_limit")) {
        return new Response(JSON.stringify(false), { status: 200 });
      }
      throw new Error("unexpected fetch");
    });
    envWithSupabase();

    const { enforceRateLimit } = await import("./distributed-rate-limit");
    const result = await enforceRateLimit("login:1.2.3.4", 5, 3_600_000);
    expect(result.ok).toBe(false);
  });

  it("falls back to the in-memory bucket when the RPC fetch fails", async () => {
    mockFetch(async () => {
      throw new Error("network down");
    });
    envWithSupabase();

    const { enforceRateLimit } = await import("./distributed-rate-limit");
    const first = await enforceRateLimit("fallback:key", 1, 60_000);
    const second = await enforceRateLimit("fallback:key", 1, 60_000);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });

  it("falls back to the in-memory bucket when privileged env is missing", async () => {
    let fetchCalled = false;
    mockFetch(async () => {
      fetchCalled = true;
      return new Response(JSON.stringify(true), { status: 200 });
    });
    envWithoutSupabase();

    const { enforceRateLimit } = await import("./distributed-rate-limit");
    const result = await enforceRateLimit("noenv:key", 5, 60_000);
    expect(result.ok).toBe(true);
    expect(fetchCalled).toBe(false);
  });
});
