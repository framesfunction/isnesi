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

  const permsResult = await serviceRequest(
    `/rest/v1/user_roles?user_id=eq.${user.id}&select=role:roles(role_permissions(permission:permissions(key)))`,
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
