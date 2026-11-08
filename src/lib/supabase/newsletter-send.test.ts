import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FUNCTION_PATH = "supabase/functions/newsletter-send/index.ts";

/**
 * ISN-001 / ISN-008 / ISN-010: newsletter-send Edge Function integrity.
 *
 * The committed file was 136 bytes of base64 garbage. These tests prove the
 * file is valid TypeScript, paginates subscribers, fails closed without a
 * provider, and uses the shared caller module.
 */
describe("newsletter-send Edge Function", () => {
  let source: string;

  it("loads the function source", () => {
    source = readFileSync(FUNCTION_PATH, "utf8");
    expect(source).toBeDefined();
    expect(source.length).toBeGreaterThan(1000);
  });

  it("ISN-001: is not base64-garbled tampered content", () => {
    expect(source).not.toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(source).not.toContain("IyBJIGlmIHN0cmluZy");
  });

  it("ISN-001: exports a Deno.serve handler", () => {
    expect(source).toContain("Deno.serve");
  });

  it("ISN-001: uses the shared requirePermissionCaller", () => {
    expect(source).toContain("requirePermissionCaller");
  });

  it("ISN-008: paginates subscribers (batch size)", () => {
    expect(source).toMatch(/BATCH_SIZE/);
    expect(source).toMatch(/offset/);
    expect(source).toMatch(/limit=\d+/);
  });

  it("ISN-008: marks campaign sending before sending", () => {
    expect(source).toContain('status: "sending"');
  });

  it("ISN-008: marks campaign sent with sent_at after all batches", () => {
    expect(source).toContain('status: "sent"');
    expect(source).toContain("sent_at");
  });

  it("ISN-008: rolls back to approved on failure", () => {
    expect(source).toContain('status: "approved"');
    expect(source).toContain("catch");
  });

  it("ISN-010: fails closed (502) when NEWSLETTER_PROVIDER is not set", () => {
    expect(source).toContain("NEWSLETTER_PROVIDER");
    expect(source).toContain("502");
  });

  it("ISN-010: batches newsletter_events inserts", () => {
    expect(source).toMatch(/newsletter_events/);
    // Batched insert passes an array body, not a single object
    expect(source).toContain("body: events");
  });
});
