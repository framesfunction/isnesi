import { z } from "zod";

/**
 * Finance module validation schemas: donation campaigns, refunds,
 * reconciliations and payment intents. The contract between admin forms
 * and the database; RLS stays the backstop.
 */

const TEXT_MAX = 400;

const optionalText = (max = TEXT_MAX) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === undefined || value.length === 0 ? null : value));

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || z.uuid().safeParse(value).success, "Invalid id.");

export const PAYMENT_STATUSES = [
  "created",
  "pending",
  "succeeded",
  "failed",
  "cancelled",
  "refunded",
  "partially_refunded",
] as const;

export const REFUND_STATUSES = ["requested", "succeeded", "failed"] as const;

export const RECONCILIATION_STATUSES = ["open", "in_review", "reconciled", "disputed"] as const;

/* ------------------------------- Campaigns -------------------------------- */

export const saveDonationCampaignSchema = z.object({
  campaignId: optionalId,
  key: z
    .string()
    .trim()
    .min(1, "Required.")
    .max(120, "Keep it under 120 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only."),
  title: z.string().trim().min(1, "Required.").max(TEXT_MAX),
  description: optionalText(600),
  isActive: z.boolean(),
  startsAt: optionalText(40).refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Use a valid date.",
  ),
  endsAt: optionalText(40).refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Use a valid date.",
  ),
});

export const toggleDonationCampaignSchema = z.object({
  campaignId: z.string().uuid(),
  isActive: z.boolean(),
});

export const deleteDonationCampaignSchema = z.object({ campaignId: z.string().uuid() });

/* -------------------------------- Refunds --------------------------------- */

export const requestDonationRefundSchema = z.object({
  donationId: z.string().uuid(),
  amountMinor: z
    .coerce.number()
    .int("Amount must be a whole number of minor units.")
    .positive("Amount must be greater than zero."),
  reason: z.string().trim().min(1, "Tell us why this refund is being requested.").max(1000),
});

export const approveDonationRefundSchema = z.object({
  refundId: z.string().uuid(),
});

/* ---------------------------- Reconciliations ----------------------------- */

export const saveReconciliationSchema = z.object({
  reconciliationId: optionalId,
  periodStart: z
    .string()
    .trim()
    .min(1, "Start date is required.")
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use a valid date (YYYY-MM-DD).",
    ),
  periodEnd: z
    .string()
    .trim()
    .min(1, "End date is required.")
    .refine(
      (value) => /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Use a valid date (YYYY-MM-DD).",
    ),
  providerKey: optionalText(120),
  statementReference: optionalText(200),
  totalMinor: z
    .coerce.number()
    .int("Total must be a whole number of minor units.")
    .nonnegative("Total cannot be negative."),
  currency: z.string().trim().min(1, "Currency is required.").max(3),
  status: z.enum(RECONCILIATION_STATUSES),
  notes: optionalText(1000),
});

/* ------------------------------ Payment intents --------------------------- */

export const createDonationIntentSchema = z.object({
  donationId: z.string().uuid(),
  amountMinor: z
    .coerce.number()
    .int("Amount must be a whole number of minor units.")
    .positive("Amount must be greater than zero."),
  currency: z.string().trim().min(1, "Currency is required.").max(3),
});
