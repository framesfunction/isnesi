import { describe, expect, it } from "vitest";

import { computeRefundPaymentStatus } from "@/features/finance/actions";

/**
 * ISN-009: refund approval must record partial vs full refund status.
 *
 * `computeRefundPaymentStatus` is a pure function: given the total amount
 * already refunded, the donation total, and the current payment status, it
 * returns the correct next status. This is the core of the ISN-009 fix and
 * can be tested in isolation without mocking the Edge Function fetch (which
 * cannot be stubbed in this vitest environment).
 */
describe("ISN-009 computeRefundPaymentStatus", () => {
  it("returns 'refunded' when total refunded equals the donation total", () => {
    expect(computeRefundPaymentStatus(10000, 10000, "succeeded")).toBe(
      "refunded",
    );
  });

  it("returns 'refunded' when total refunded exceeds the donation total", () => {
    expect(computeRefundPaymentStatus(12000, 10000, "succeeded")).toBe(
      "refunded",
    );
  });

  it("returns 'partially_refunded' when total refunded is below the total", () => {
    expect(computeRefundPaymentStatus(3000, 10000, "succeeded")).toBe(
      "partially_refunded",
    );
  });

  it("returns 'partially_refunded' for a small refund", () => {
    expect(computeRefundPaymentStatus(1, 10000, "succeeded")).toBe(
      "partially_refunded",
    );
  });

  it("keeps the current status when nothing has been refunded", () => {
    expect(computeRefundPaymentStatus(0, 10000, "succeeded")).toBe(
      "succeeded",
    );
    expect(computeRefundPaymentStatus(0, 10000, "pending")).toBe("pending");
  });

  it("handles a zero donation total", () => {
    expect(computeRefundPaymentStatus(0, 0, "succeeded")).toBe("refunded");
    expect(computeRefundPaymentStatus(1, 0, "succeeded")).toBe("refunded");
  });

  it("is unaffected by the donation currency", () => {
    // Currency is not an input; only amounts matter.
    expect(computeRefundPaymentStatus(5000, 10000, "succeeded")).toBe(
      "partially_refunded",
    );
  });
});
