/**
 * Minimal in-process rate limiter.
 *
 * This is defence in depth for public Server Actions while the authoritative,
 * distributed throttling lives in the platform (Supabase Edge Function or the
 * hosting provider's WAF). Serverless instances each keep their own counters, so
 * this must never be the only control protecting a public endpoint.
 */

type Bucket = { count: number; resetAt: number };

const MAX_TRACKED_KEYS = 5_000;
const buckets = new Map<string, Bucket>();

function prune(now: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: options.limit - bucket.count, retryAfterSeconds: 0 };
}

/** Best-effort client identity for rate-limit keys. */
export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** Exposed for tests only. */
export function __resetRateLimiter(): void {
  buckets.clear();
}