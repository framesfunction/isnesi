/**
 * Distributed rate limit for Next.js server routes and actions.
 *
 * Backed by `app_private.consume_rate_limit()` (migration
 * `202611090001_rate_limit_buckets.sql`), so the count is shared across all
 * server instances — unlike the per-instance in-memory bucket in
 * `rate-limit.ts`, which resets per serverless isolate.
 *
 * Degradation path (honest, never fails a request because of rate limiting):
 * if the privileged environment is not configured, the RPC is missing, or the
 * network call fails, the request is rate-limited by the per-instance
 * in-memory bucket instead. This matches the Edge Function fallback in
 * `supabase/functions/_shared/caller.ts`.
 */
import { getPublicEnv, getServerEnv } from "@/lib/env";
import { rateLimit, type RateLimitResult } from "./rate-limit";

export type DistributedRateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<DistributedRateLimitResult> {
  let supabaseUrl: string | null = null;
  let serviceRoleKey: string | null = null;
  try {
    supabaseUrl = getPublicEnv().supabaseUrl;
    serviceRoleKey = getServerEnv().serviceRoleKey;
  } catch {
    // Privileged env not configured -> per-instance in-memory bucket.
    return toResult(rateLimit(key, { limit, windowMs }));
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return toResult(rateLimit(key, { limit, windowMs }));
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/consume_rate_limit`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          p_bucket_key: key,
          p_limit: limit,
          p_window_seconds: Math.max(1, Math.round(windowMs / 1000)),
        }),
      },
    );
    if (!response.ok) {
      // RPC unavailable or misconfigured -> per-instance in-memory bucket.
      return toResult(rateLimit(key, { limit, windowMs }));
    }
    const allowed = (await response.json()) === true;
    return {
      ok: allowed,
      remaining: 0,
      retryAfterSeconds: allowed ? 0 : Math.ceil(windowMs / 1000),
    };
  } catch {
    // Network error -> per-instance in-memory bucket.
    return toResult(rateLimit(key, { limit, windowMs }));
  }
}

function toResult(result: RateLimitResult): DistributedRateLimitResult {
  return {
    ok: result.ok,
    remaining: result.remaining,
    retryAfterSeconds: 0,
  };
}
