import { serviceRequest } from "./safeguarding.ts";

/**
 * Generic authenticated-caller check for Edge Functions.
 *
 * Mirrors `app_private.has_permission()`: resolve the caller from the JWT,
 * then resolve permissions from `user_roles → role_permissions → permissions`.
 * Fails closed when the token, the permission or the permission lookup cannot
 * be verified.
 */
export async function requirePermissionCaller(
  request: Request,
  permission: string,
): Promise<{ ok: true; userId: string; permissions: string[] } | { ok: false; response: Response }> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userResult = await fetch(`${Deno.env.get("SUPABASE_URL") ?? ""}/auth/v1/user`, {
    headers: {
      apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

  // Mirror app_private.has_permission(): an inactive profile or expired role
  // grant must be denied here, not just in the server-side admin UI.
  const now = new Date().toISOString();
  const permsResult = await serviceRequest(
    `/rest/v1/user_roles?select=role:roles(role_permissions(permission:permissions(key))),profiles!inner(is_active=eq.true)&user_id=eq.${user.id}&or=(expires_at.is.null,expires_at.gt.${encodeURIComponent(now)})`,
  );
  if (!permsResult.ok) {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const rows =
    permsResult.data as Array<{ role: { role_permissions: Array<{ permission: { key: string } }> } }>;
  const permissions = rows.flatMap((row) =>
    row.role.role_permissions.map((item) => item.permission.key),
  );
  if (!permissions.includes(permission)) {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id, permissions };
}

/** Per-IP in-memory rate limiter shared by public functions. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number } {
  return bucket(key, limit, windowMs);
}

/**
 * ISN-003: the in-memory buckets above are per-Edge-Function-isolate, so the
 * documented limits were never global under concurrent isolates. The DB-backed
 * limiter below runs an atomic upsert (`app_private.consume_rate_limit`) so the
 * count is shared by all isolates.
 *
 * Failure policy: if the limiter call cannot be completed (network error or
 * the RPC is missing because the migration was not applied), we fall back to
 * the in-memory bucket rather than failing the whole request. Rate limiting
 * then degrades to per-isolate, which is the pre-ISN-003 behavior, while the
 * request itself still works.
 */
export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (supabaseUrl && serviceRoleKey) {
    try {
      const result = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_rate_limit`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          p_bucket_key: key,
          p_limit: limit,
          p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
        }),
      });
      if (result.ok) {
        const allowed = (await result.json()) === true;
        return { ok: allowed, remaining: 0 };
      }
    } catch {
      // fall through to the in-memory bucket
    }
  }
  return rateLimit(key, limit, windowMs);
}

function buckets() {
  const globalStore = globalThis as typeof globalThis & {
    __isnesiRateBuckets?: Map<string, { count: number; resetAt: number }>;
  };
  if (!globalStore.__isnesiRateBuckets) {
    globalStore.__isnesiRateBuckets = new Map();
  }
  return globalStore.__isnesiRateBuckets;
}

function bucket(key: string, limit: number, windowMs: number) {
  const store = buckets();
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
