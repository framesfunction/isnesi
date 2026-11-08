import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { SignInState } from "@/features/auth/state";

/**
 * ISN-006: staff sign-in must be rate-limited to prevent brute-force /
 * credential-stuffing attacks.
 *
 * Mocks @/lib/security/rate-limit to prove:
 * 1. When rate-limited, signInAction returns "Too many sign-in attempts"
 *    WITHOUT calling Supabase Auth.
 * 2. When not rate-limited, signInAction proceeds to Supabase Auth.
 */

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers({ "x-forwarded-for": "203.0.113.9" })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  rateLimit: vi.fn(),
  clientKey: vi.fn((headers: Headers, scope: string) => `${scope}:test-ip`),
}));

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: vi.fn(() => true),
}));

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

import { rateLimit } from "@/lib/security/rate-limit";
import { signInAction } from "@/features/auth/actions";

const mockedRateLimit = rateLimit as unknown as ReturnType<typeof vi.fn>;
const mockedSignInWithPassword = mockSupabase.auth
  .signInWithPassword as unknown as ReturnType<typeof vi.fn>;

function formData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("email", "staff@example.org");
  fd.set("password", "Password123!");
  fd.set("next", "/admin");
  for (const [key, value] of Object.entries(overrides)) {
    fd.set(key, value);
  }
  return fd;
}

describe("ISN-006 sign-in rate limiting", () => {
  beforeEach(() => {
    vi.resetModules();
    mockedRateLimit.mockReturnValue({ ok: true, remaining: 4, retryAfterSeconds: 0 });
    mockedSignInWithPassword.mockResolvedValue({ error: null, data: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns rate-limit error when rate-limited (no Supabase Auth call)", async () => {
    mockedRateLimit.mockReturnValue({
      ok: false,
      remaining: 0,
      retryAfterSeconds: 3600,
    });

    const result: SignInState = await signInAction({ status: "idle" }, formData());

    expect(result.status).toBe("error");
    expect(result.message).toBe("Too many sign-in attempts. Please try again later.");
    expect(mockedSignInWithPassword).not.toHaveBeenCalled();
  });

  it("proceeds to Supabase Auth when not rate-limited", async () => {
    await signInAction({ status: "idle" }, formData());

    expect(mockedRateLimit).toHaveBeenCalled();
    expect(mockedSignInWithPassword).toHaveBeenCalledWith({
      email: "staff@example.org",
      password: "Password123!",
    });
  });

  it("allows up to the limit before blocking", async () => {
    // First 5 attempts allowed
    for (let i = 0; i < 5; i += 1) {
      mockedRateLimit.mockReturnValueOnce({ ok: true, remaining: 4 - i, retryAfterSeconds: 0 });
      await signInAction({ status: "idle" }, formData());
      expect(mockedSignInWithPassword).toHaveBeenCalledTimes(i + 1);
    }
    // 6th blocked
    mockedRateLimit.mockReturnValue({ ok: false, remaining: 0, retryAfterSeconds: 3600 });
    const result = await signInAction({ status: "idle" }, formData());
    expect(result.status).toBe("error");
    expect(result.message).toBe("Too many sign-in attempts. Please try again later.");
    expect(mockedSignInWithPassword).toHaveBeenCalledTimes(5);
  });
});
