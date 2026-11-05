import { z } from "zod";

import { optionalBlocksBody } from "@/lib/validation/cms";

/**
 * Engagement module validation schemas: enquiry workflow, newsletter
 * subscribers/consents/segments/campaigns. The contract between admin forms
 * and the database; RLS stays the backstop.
 */

const TEXT_MAX = 400;

const optionalText = (max = TEXT_MAX) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value));

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .refine((value) => value === null || z.uuid().safeParse(value).success, "Invalid id.");

/* -------------------------------- Enquiries -------------------------------- */

export const ENQUIRY_STATUSES = [
  "new",
  "triaged",
  "assigned",
  "in_progress",
  "waiting",
  "closed",
  "spam",
] as const;

export const assignEnquirySchema = z.object({
  enquiryId: z.string().uuid(),
  assigneeId: z.string().uuid(),
  reason: optionalText(600),
});

export const enquiryStatusSchema = z.object({
  enquiryId: z.string().uuid(),
  status: z.enum(ENQUIRY_STATUSES),
});

export const enquiryNoteSchema = z.object({
  enquiryId: z.string().uuid(),
  note: z.string().trim().min(1, "Write the note.").max(4000),
});

export const enquiryMessageSchema = z.object({
  enquiryId: z.string().uuid(),
  direction: z.enum(["outbound", "inbound"]),
  channel: z.enum(["email", "phone", "post", "in_person"]),
  body: z.string().trim().min(1, "Write the message.").max(20000),
});

/* ------------------------------- Newsletter -------------------------------- */

export const SUBSCRIBER_STATUSES = [
  "pending",
  "subscribed",
  "unsubscribed",
  "suppressed",
] as const;

export const CONSENT_STATUSES = ["granted", "withdrawn", "expired"] as const;

export const subscriberStatusSchema = z.object({
  subscriberId: z.string().uuid(),
  status: z.enum(SUBSCRIBER_STATUSES),
  source: optionalText(120),
});

export const consentRecordSchema = z.object({
  subscriberId: z.string().uuid(),
  consentStatus: z.enum(CONSENT_STATUSES),
  source: z.string().trim().min(1, "Record where the consent came from.").max(120),
  policyVersion: optionalText(60),
  evidenceReference: optionalText(200),
});

export const segmentSchema = z.object({
  name: z.string().trim().min(1, "Required.").max(120),
  description: optionalText(400),
});

export const segmentMembershipSchema = z.object({
  subscriberId: z.string().uuid(),
  segmentId: z.string().uuid(),
  member: z.boolean(),
});

export const saveCampaignSchema = z.object({
  campaignId: optionalId,
  name: z.string().trim().min(1, "Required.").max(200),
  subject: z.string().trim().min(1, "Required.").max(300),
  bodyBlocks: optionalBlocksBody,
  scheduledAt: optionalText(40).refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Use a valid date.",
  ),
});

export const campaignWorkflowSchema = z.object({
  campaignId: z.string().uuid(),
  action: z.enum(["approve", "cancel"]),
});
