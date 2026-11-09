import type { Database } from "@/types/database";

export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

/**
 * Compute a donation's payment status after a refund is applied.
 *
 * Pure function: easy to unit-test in isolation (see actions.test.ts).
 * Keeps the refund approval action free of branching logic.
 *
 * Lives outside `actions.ts` because Next 16 requires every export of a
 * `"use server"` module to be an async server action.
 */
export function computeRefundPaymentStatus(
  totalRefunded: number,
  amountMinor: number,
  currentStatus: PaymentStatus,
): PaymentStatus {
  if (totalRefunded >= amountMinor) return "refunded";
  if (totalRefunded > 0) return "partially_refunded";
  return currentStatus;
}
