import { describe, expect, it, vi, afterEach } from "vitest";

/**
 * SES adapter: verifies the signed request structure and the happy /
 * failure paths. Not exercised against live AWS (no credentials in this
 * environment) — documented in STATUS.md.
 */

function mockDeno(envImpl: (key: string) => string | undefined) {
  vi.stubGlobal(
    "Deno",
    { env: { get: envImpl } } as unknown as typeof globalThis & typeof Deno,
  );
}

function mockFetch(
  impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  vi.stubGlobal("fetch", impl as unknown as typeof globalThis.fetch);
}

const captured: { authorization?: string; "x-amz-date"?: string; url?: string } = {};

afterEach(() => {
  vi.unstubAllGlobals();
  Object.keys(captured).forEach((key) => delete captured[key]);
});

describe("sesAdapter signs requests with AWS Signature V4", () => {
  const creds = {
    "SES_REGION": "us-east-1",
    "SES_ACCESS_KEY_ID": "AKIAEXAMPLEACCESSKEY",
    "SES_SECRET_ACCESS_KEY": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  };

  it("posts to SES v2 with a structurally valid Authorization header", async () => {
    mockDeno((key) => creds[key as keyof typeof creds] ?? undefined);
    mockFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      captured.url = url;
      if (init?.headers) {
        const headers = init.headers as Record<string, string>;
        captured.authorization = headers.authorization;
        captured["x-amz-date"] = headers["x-amz-date"];
      }
      return new Response(JSON.stringify({ MessageId: "msg-123" }), {
        status: 200,
      });
    });

    const mod = await import("./ses.ts");
    const result = await mod.sesAdapter({
      to: "donor@example.org",
      from: "noreply@example.org",
      subject: "Receipt",
      text: "Thank you for your gift.",
    });

    expect(result.ok).toBe(true);
    expect(result.providerMessageId).toBe("msg-123");
    expect(captured.url).toBe(
      "https://email.us-east-1.amazonaws.com/v2/email/outbound-emails",
    );
    expect(captured.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLEACCESSKEY\/\d{8}\/us-east-1\/es\/aws4_request, SignedHeaders=host;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    expect(captured["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it("fails closed when SES credentials are missing", async () => {
    mockDeno(() => undefined);
    let fetchCalled = false;
    mockFetch(async () => {
      fetchCalled = true;
      return new Response(JSON.stringify({ MessageId: "x" }), { status: 200 });
    });

    const mod = await import("./ses.ts");
    const result = await mod.sesAdapter({
      to: "donor@example.org",
      from: "noreply@example.org",
      subject: "Receipt",
      text: "Thank you.",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("SES credentials are not configured");
    expect(fetchCalled).toBe(false);
  });

  it("fails closed when the SES API returns an error", async () => {
    mockDeno((key) => creds[key as keyof typeof creds] ?? undefined);
    mockFetch(async () => {
      return new Response(
        JSON.stringify({ Message: "Invalid parameter: FromEmailAddress" }),
        { status: 400 },
      );
    });

    const mod = await import("./ses.ts");
    const result = await mod.sesAdapter({
      to: "donor@example.org",
      from: "noreply@example.org",
      subject: "Receipt",
      text: "Thank you.",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("SES API error (400)");
  });
});
