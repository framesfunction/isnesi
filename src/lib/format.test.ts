import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, minorUnitDigits, statusLabel, truncate } from "@/lib/format";

describe("minorUnitDigits", () => {
  it("treats XAF as a zero-decimal currency", () => {
    expect(minorUnitDigits("XAF")).toBe(0);
  });

  it("treats EUR as a two-decimal currency", () => {
    expect(minorUnitDigits("EUR")).toBe(2);
  });

  it("falls back to two digits for an invalid currency code", () => {
    expect(minorUnitDigits("NOT-A-CURRENCY")).toBe(2);
  });
});

describe("formatCurrency", () => {
  it("does not divide XAF amounts (no minor unit)", () => {
    expect(formatCurrency(25_000, "XAF")).toContain("25,000");
  });

  it("divides currencies that have minor units", () => {
    expect(formatCurrency(2_500, "EUR")).toContain("25");
  });
});

describe("formatDate", () => {
  it("returns a placeholder for empty or invalid values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO timestamp", () => {
    expect(formatDate("2026-02-14T10:00:00.000Z")).toContain("2026");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("Inclusive education", 40)).toBe("Inclusive education");
  });

  it("adds an ellipsis when the string is too long", () => {
    const result = truncate("a".repeat(30), 10);
    expect(result).toHaveLength(10);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("statusLabel", () => {
  it("humanises snake_case statuses", () => {
    expect(statusLabel("in_review")).toBe("In Review");
    expect(statusLabel("published")).toBe("Published");
  });
});