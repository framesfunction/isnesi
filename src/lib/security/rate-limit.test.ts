import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetRateLimiter, clientKey, rateLimit } from "@/lib/security/rate-limit";

beforeEach(() => {
  __resetRateLimiter();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = rateLimit("key", { limit: 3, windowMs: 60_000 });
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(3 - attempt);
    }
  });

  it("blocks the request after the limit is reached", () => {
    rateLimit("key", { limit: 1, windowMs: 60_000 });
    const blocked = rateLimit("key", { limit: 1, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets once the window has elapsed", () => {
    rateLimit("key", { limit: 1, windowMs: 1_000 });
    expect(rateLimit("key", { limit: 1, windowMs: 1_000 }).ok).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit("key", { limit: 1, windowMs: 1_000 }).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    rateLimit("first", { limit: 1, windowMs: 60_000 });
    expect(rateLimit("first", { limit: 1, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit("second", { limit: 1, windowMs: 60_000 }).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address and scopes the key", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(clientKey(headers, "enquiry")).toBe("enquiry:203.0.113.9");
  });

  it("falls back to x-real-ip then unknown", () => {
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.4" }), "newsletter")).toBe(
      "newsletter:198.51.100.4",
    );
    expect(clientKey(new Headers(), "newsletter")).toBe("newsletter:unknown");
  });
});