import { z } from "zod";

/**
 * Kids' Corner validation schemas: resource creation/editing and the
 * safeguarding review workflow. The contract between admin forms and the
 * database; RLS stays the backstop.
 */

const TEXT_MAX = 400;
const CONTENT_MAX = 10_000;

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

export const KIDS_RESOURCE_TYPES = [
  "story",
  "activity",
  "game",
  "video",
  "download",
] as const;

export type KidsResourceType = (typeof KIDS_RESOURCE_TYPES)[number];

export const KIDS_CONTENT_STATUSES = ["draft", "in_review", "approved", "published", "rejected", "archived"] as const;

/* -------------------------------- Resources -------------------------------- */

export const saveKidsResourceSchema = z.object({
  resourceId: optionalId,
  resourceType: z.enum(KIDS_RESOURCE_TYPES),
  title: z.string().trim().min(1, "Required.").max(TEXT_MAX),
  description: optionalText(CONTENT_MAX),
  minAge: z
    .coerce.number()
    .int("Minimum age must be a whole number.")
    .nonnegative("Minimum age cannot be negative.")
    .optional(),
  maxAge: z
    .coerce.number()
    .int("Maximum age must be a whole number.")
    .nonnegative("Maximum age cannot be negative.")
    .optional(),
  featured: z.boolean(),
});

export const kidsResourceReviewSchema = z.object({
  resourceId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: optionalText(600),
});

export const kidsResourceToggleSchema = z.object({
  resourceId: z.string().uuid(),
  featured: z.boolean(),
});

export const deleteKidsResourceSchema = z.object({ resourceId: z.string().uuid() });

/* ----------------------------- Accessibility ----------------------------- */

export const ACCESSIBILITY_PREFERENCES = ["reducedMotion", "highContrast", "largeText", "dyslexicFont"] as const;

export type AccessibilityPreference = (typeof ACCESSIBILITY_PREFERENCES)[number];

export const accessibilitySettingsSchema = z.object({
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  largeText: z.boolean().optional(),
  dyslexicFont: z.boolean().optional(),
});

export const accessibilityReviewSchema = z.object({
  entityType: z.enum(["page", "story"]),
  entityId: z.string().uuid(),
  reviewerId: z.string().uuid().optional(),
  wcagLevel: z.enum(["A", "AA", "AAA"]),
  passed: z.boolean(),
  issues: optionalText(1000),
  notes: optionalText(2000),
});
