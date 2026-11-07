import { describe, expect, it } from "vitest";

import { describeVolumes, groupVolumeByCurrency } from "@/features/finance/volumes";

describe("groupVolumeByCurrency", () => {
  it("returns an empty list when there is no data", () => {
    expect(groupVolumeByCurrency(null)).toEqual([]);
    expect(groupVolumeByCurrency([])).toEqual([]);
  });

  it("groups amounts per currency instead of summing across currencies", () => {
    const volumes = groupVolumeByCurrency([
      { amount_minor: 100_000, currency: "XAF" },
      { amount_minor: 2_500, currency: "EUR" },
      { amount_minor: 50_000, currency: "XAF" },
    ]);
    expect(volumes).toEqual([
      { currency: "XAF", count: 2, minor: 150_000 },
      { currency: "EUR", count: 1, minor: 2_500 },
    ]);
  });

  it("defaults a missing currency to XAF", () => {
    expect(groupVolumeByCurrency([{ amount_minor: 75, currency: "" }])).toEqual([
      { currency: "XAF", count: 1, minor: 75 },
    ]);
  });
});

describe("describeVolumes", () => {
  const format = (amountMinor: number, currency: string) =>
    `${currency} ${amountMinor.toLocaleString("en-GB")}`;

  it("renders an em dash when no rows exist", () => {
    expect(describeVolumes([], format)).toBe("—");
  });

  it("renders one label per currency", () => {
    expect(
      describeVolumes(
        [
          { currency: "XAF", count: 2, minor: 150_000 },
          { currency: "EUR", count: 1, minor: 2_500 },
        ],
        format,
      ),
    ).toBe("XAF 150,000 XAF · EUR 2,500 EUR");
  });
});
