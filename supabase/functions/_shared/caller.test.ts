import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * ISN-002: Edge Function authorization must respect profile is_active and
 * role expires_at, mirroring app_private.has_permission().
 *
 * These tests mock fetch to prove:
 * 1. The permissions request URL includes the profiles.is_active join and the
 *    expires_at expiry filter.
 * 2. An inactive profile is denied even with a valid JWT and matching permission.
 * 3. An expired role grant is denied.
 * 4. An active, non-expired grant is allowed.
 */

function mockEnv(getImpl: (key: string) => string | undefined) {
  vi.stubGlobal(
    "Deno",
    { env: { get: getImpl } } as unknown as typeof globalThis & typeof Deno,
  );
}

function mockFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", impl as unknown as typeof globalThis.fetch);
}

const baseUrl = "https://example.supabase.co";
const serviceRoleKey = "sb_secret_testkey";

const userResponse = () =>
  new Response(JSON.stringify({ id: "user-123" }), { status: 200 });

const permissionsResponse = (rows: unknown[]) =>
  new Response(JSON.stringify(rows), { status: 200 });

const activeUserRow = {
  role: {
    role_permissions: [{ permission: { key: "newsletter.manage" } }],
  },
};

describe("ISN-002 requirePermissionCaller respects is_active and expires_at", () => {
  let fetchCalls: string[] = [];

  beforeEach(() => {
    fetchCalls = [];
    mockFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      fetchCalls.push(url);

      if (url.includes("/auth/v1/user")) {
        return userResponse();
      }
      // Permissions lookup
      return permissionsResponse([activeUserRow]);
    });
    mockEnv((envKey: string) => {
      if (envKey === "SUPABASE_URL") return baseUrl;
      if (envKey === "SUPABASE_SERVICE_ROLE_KEY") return serviceRoleKey;
      return undefined;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes profiles.is_active join in the permissions URL", async () => {
    const mod = await import("./caller.ts");
    const { requirePermissionCaller } = mod;
    await requirePermissionCaller(
      new Request("https://x/", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      }),
      "newsletter.manage",
    );

    const permsUrl = fetchCalls.find((u) => u.includes("/user_roles"));
    expect(permsUrl).toBeDefined();
    expect(permsUrl).toContain("profiles!inner(is_active=eq.true)");
  });

  it("includes expires_at expiry filter in the permissions URL", async () => {
    const mod = await import("./caller.ts");
    const { requirePermissionCaller } = mod;
    await requirePermissionCaller(
      new Request("https://x/", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      }),
      "newsletter.manage",
    );

    const permsUrl = fetchCalls.find((u) => u.includes("/user_roles"));
    expect(permsUrl).toBeDefined();
    expect(permsUrl).toContain("expires_at");
    expect(permsUrl).toContain("or=(");
  });

  it("denies an inactive profile even with valid JWT and permission", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return userResponse();
      // Inactive profile: PostgREST inner join on profiles filters it out -> no rows.
      return permissionsResponse([]);
    });
    mockEnv((envKey: string) => {
      if (envKey === "SUPABASE_URL") return baseUrl;
      if (envKey === "SUPABASE_SERVICE_ROLE_KEY") return serviceRoleKey;
      return undefined;
    });

    const mod = await import("./caller.ts");
    const { requirePermissionCaller } = mod;
    const result = (await requirePermissionCaller(
      new Request("https://x/", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      }),
      "newsletter.manage",
    )) as { ok: false; response: Response };

    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(403);
  });

  it("denies when all role grants are expired", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return userResponse();
      // Expired grant: expires_at filter excludes it -> no rows.
      return permissionsResponse([]);
    });
    mockEnv((envKey: string) => {
      if (envKey === "SUPABASE_URL") return baseUrl;
      if (envKey === "SUPABASE_SERVICE_ROLE_KEY") return serviceRoleKey;
      return undefined;
    });

    const mod = await import("./caller.ts");
    const { requirePermissionCaller } = mod;
    const result = (await requirePermissionCaller(
      new Request("https://x/", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      }),
      "newsletter.manage",
    )) as { ok: false; response: Response };

    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(403);
  });

  it("allows an active, non-expired grant", async () => {
    const mod = await import("./caller.ts");
    const { requirePermissionCaller } = mod;
    const result = (await requirePermissionCaller(
      new Request("https://x/", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      }),
      "newsletter.manage",
    )) as { ok: true; userId: string };

    expect(result.ok).toBe(true);
    expect(result.userId).toBe("user-123");
  });

  it("requires the exact permission, not just any permission", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return userResponse();
      return permissionsResponse([
        {
          role: {
            role_permissions: [{ permission: { key: "other.permission" } }],
          },
        },
      ]);
    });
    mockEnv((envKey: string) => {
      if (envKey === "SUPABASE_URL") return baseUrl;
      if (envKey === "SUPABASE_SERVICE_ROLE_KEY") return serviceRoleKey;
      return undefined;
    });

    const mod = await import("./caller.ts");
    const { requirePermissionCaller } = mod;
    const result = (await requirePermissionCaller(
      new Request("https://x/", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
      }),
      "newsletter.manage",
    )) as { ok: false; response: Response };

    expect(result.ok).toBe(false);
    expect(result.response.status).toBe(403);
  });
});
