import { describe, expect, it } from "vitest";

import { timingSafeEqual } from "./timing-safe";

describe("timingSafeEqual", () => {
  it("returns true for equal strings", () => {
    expect(timingSafeEqual("secret", "secret")).toBe(true);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("a", "a")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(timingSafeEqual("secret", "secret2")).toBe(false);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("x", "y")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqual("short", "muchlongerstring")).toBe(false);
    expect(timingSafeEqual("", "nonempty")).toBe(false);
    expect(timingSafeEqual("nonempty", "")).toBe(false);
  });

  it("returns false when only the last character differs (timing-attack scenario)", () => {
    // A naive early-return comparison would short-circuit here and leak that
    // the prefix matched. timingSafeEqual must not.
    expect(timingSafeEqual("aaaaab", "aaaaac")).toBe(false);
    expect(timingSafeEqual("aaaaab", "aaaaab")).toBe(true);
  });

  it("returns false when only the first character differs", () => {
    expect(timingSafeEqual("baaaaa", "aaaaaa")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(timingSafeEqual("Secret", "secret")).toBe(false);
  });
});
