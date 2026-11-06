import { z } from "zod";

/**
 * CMS validation schemas.
 *
 * These are the contract between admin forms and the database: every Server
 * Action parses its `FormData` through one of these before touching Supabase,
 * and RLS stays the backstop. The block vocabulary mirrors exactly what
 * `components/public/content-blocks.tsx` and `page-sections.tsx` can render;
 * anything else is rejected at save time, so unknown shapes can never reach
 * the public site.
 */

const TEXT_FIELD_MAX = 400;
const BODY_MAX = 20_000;

const slug = z
  .string()
  .trim()
  .min(1, "Required.")
  .max(120, "Keep it under 120 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only.");

/** Optional single-line text: empty string normalises to `null`. */
const optionalText = z
  .string()
  .trim()
  .max(TEXT_FIELD_MAX, `Keep it under ${TEXT_FIELD_MAX} characters.`)
  .transform((value) => (value.length === 0 ? null : value));

const optionalUrl = z
  .string()
  .trim()
  .max(600)
  .transform((value) => (value.length === 0 ? null : value))
  .refine(
    (value) => value === null || /^https?:\/\/[^\s]+$/i.test(value),
    "Use a full http(s) URL.",
  );

const blockSchema = z.union([
  z.object({ type: z.literal("heading"), text: z.string().min(1), level: z.union([z.literal(2), z.literal(3)]) }),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }),
  z.object({ type: z.literal("list"), items: z.array(z.string().min(1)).min(1), ordered: z.boolean().default(false) }),
  z.object({ type: z.literal("quote"), text: z.string().min(1) }),
  z.object({ type: z.literal("callout"), text: z.string().min(1) }),
]);

const blocksBody = z
  .array(blockSchema)
  .max(100, "Split long content into multiple sections.")
  .refine((blocks) => blocks.length > 0, "Add at least one block.");

/** Same vocabulary, but an empty body is allowed (unfinished translations). */
export const optionalBlocksBody = z.array(blockSchema).max(100);

/** JSON.parse helper that co-operates with `transform` for text areas. */
export function parseJsonOr(value: string): { ok: true; value: unknown } | { ok: false } {
  if (value.trim().length === 0) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

/* -------------------------------- Pages ----------------------------------- */

export const PAGE_TYPES = ["standard", "landing", "programme", "editorial_index", "policy"] as const;
export type PageTypeInput = (typeof PAGE_TYPES)[number];

export const createPageSchema = z.object({
  slug,
  pageType: z.enum(PAGE_TYPES),
  titleEn: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
  excerptEn: optionalText,
  seoTitleEn: optionalText,
  seoDescriptionEn: optionalText,
  bodyEnBlocks: blocksBody,
});

export const updatePageSchema = z.object({
  pageId: z.string().uuid(),
  slug,
  pageType: z.enum(PAGE_TYPES),
  showInNavigation: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  titleEn: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
  excerptEn: optionalText,
  seoTitleEn: optionalText,
  seoDescriptionEn: optionalText,
  bodyEnBlocks: blocksBody,
});

export const pageSectionSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("text"),
      pageId: z.string().uuid(),
      sectionId: z.string().uuid().optional(),
      sectionKey: slug,
      heading: optionalText,
      text: z.string().trim().max(BODY_MAX).optional(),
      sortOrder: z.coerce.number().int().min(0).max(999),
      isEnabled: z.boolean(),
    }),
    z.object({
      kind: z.literal("blocks"),
      pageId: z.string().uuid(),
      sectionId: z.string().uuid().optional(),
      sectionKey: slug,
      body: blocksBody,
      sortOrder: z.coerce.number().int().min(0).max(999),
      isEnabled: z.boolean(),
    }),
  ])
  .refine(
    (input) =>
      input.kind === "blocks" ||
      (input.heading !== null && input.heading.length > 0) ||
      (typeof input.text === "string" && input.text.trim().length > 0),
    "A text section needs a heading or a body.",
  );

export const sectionVisibilitySchema = z.object({
  pageId: z.string().uuid(),
  sectionId: z.string().uuid(),
  isEnabled: z.boolean(),
});

export const sectionReorderSchema = z.object({
  pageId: z.string().uuid(),
  sectionId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const deleteSectionSchema = z.object({
  pageId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

/* ------------------------------ Programmes -------------------------------- */

export const saveProgrammeSchema = z.object({
  programmeId: z.string().uuid().optional(),
  key: slug,
  icon: optionalText,
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
  featuredImageId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || z.uuid().safeParse(value).success,
      "Choose an asset from the media library.",
    ),
  objectives: z.array(z.string().trim().min(1)).max(30).optional(),
  activities: z.array(z.string().trim().min(1)).max(30).optional(),
  targetBeneficiaries: optionalText,
  geographicCoverage: optionalText,
  titleEn: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
  summaryEn: optionalText,
  seoTitleEn: optionalText,
  seoDescriptionEn: optionalText,
  bodyEnBlocks: blocksBody,
});
export const programmeToggleSchema = z.object({
  programmeId: z.string().uuid(),
  isActive: z.boolean(),
});

export const programmeReorderSchema = z.object({
  programmeId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const deleteProgrammeSchema = z.object({
  programmeId: z.string().uuid(),
});

/* ------------------------------- Stories ---------------------------------- */

export const CONTENT_TYPES = ["story", "news", "announcement", "policy"] as const;
export type ContentTypeInput = (typeof CONTENT_TYPES)[number];

export const saveContentSchema = z.object({
  contentId: z.string().uuid().optional(),
  slug,
  contentType: z.enum(CONTENT_TYPES),
  featured: z.boolean(),
  scheduledAt: optionalText.refine(
    (value) => value === null || !Number.isNaN(Date.parse(value)),
    "Use a valid date.",
  ),
  titleEn: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
  excerptEn: optionalText,
  seoTitleEn: optionalText,
  seoDescriptionEn: optionalText,
  bodyEnBlocks: blocksBody,
  /** Present only when the editor submitted the taxonomy fieldset. */
  taxonomyPresent: z.boolean().default(false),
  categoryIds: z.array(z.string().uuid()).max(50).default([]),
  tagIds: z.array(z.string().uuid()).max(50).default([]),
});

export const contentWorkflowSchema = z.object({
  contentId: z.string().uuid(),
  action: z.enum(["submit", "reject", "approve", "publish", "unpublish", "archive"]),
  note: optionalText,
});

/* -------------------------------- Media ----------------------------------- */

export const MEDIA_BUCKETS = {
  public: "public-media",
} as const;

export const MEDIA_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
] as const;

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

const RIGHTS_STATUSES = [
  "pending",
  "owned",
  "licensed",
  "permission_recorded",
  "restricted",
  "expired",
] as const;

export const uploadMediaSchema = z.object({
  file: z
    .instanceof(File, { message: "Choose a file." })
    .refine((file) => file.size > 0, "The file is empty.")
    .refine(
      (file) => file.size <= MAX_MEDIA_BYTES,
      "Files must be 10 MB or smaller in the public library.",
    )
    .refine(
      (file) => (MEDIA_ALLOWED_MIME as readonly string[]).includes(file.type),
      "Only JPEG, PNG, WebP, AVIF and PDF files are allowed.",
    ),
  altText: optionalText,
  caption: optionalText,
  credit: optionalText,
  rightsStatus: z.enum(RIGHTS_STATUSES),
  rightsReference: optionalText,
  consentReference: optionalText,
});

export const updateMediaSchema = z.object({
  mediaId: z.string().uuid(),
  altText: optionalText,
  caption: optionalText,
  credit: optionalText,
  rightsStatus: z.enum(RIGHTS_STATUSES),
  rightsReference: optionalText,
  consentReference: optionalText,
});

export const deleteMediaSchema = z.object({ mediaId: z.string().uuid() });

/* ------------------------------- Partners --------------------------------- */

export const savePartnerSchema = z.object({
  partnerId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
  relationshipType: optionalText,
  websiteUrl: optionalUrl,
  logoMediaId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || z.uuid().safeParse(value).success,
      "Choose an asset from the media library.",
    ),
  descriptionEn: optionalText,
});

export const partnerApprovalSchema = z.object({
  partnerId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  publicVisible: z.boolean(),
});

export const deletePartnerSchema = z.object({ partnerId: z.string().uuid() });

/* ------------------------------- Navigation ------------------------------- */

const HREF_MAX = 600;

export const saveNavigationItemSchema = z
  .object({
    itemId: z.string().uuid().optional(),
    menuId: z.string().uuid(),
    parentItemId: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null))
      .refine(
        (value) => value === null || z.uuid().safeParse(value).success,
        "Invalid parent item.",
      ),
    label: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
    href: z.string().trim().min(1, "Required.").max(HREF_MAX),
    sortOrder: z.coerce.number().int().min(-999).max(999),
    isVisible: z.boolean(),
    openNewTab: z.boolean(),
  })
  .refine(
    (item) => /^https?:\/\//i.test(item.href) || item.href.startsWith("/"),
    "Internal links start with a slash; external links use a full http(s) URL.",
  );

export const deleteNavigationItemSchema = z.object({ itemId: z.string().uuid() });

export const navigationItemVisibilitySchema = z.object({
  itemId: z.string().uuid(),
  isVisible: z.boolean(),
});

export const navigationItemReorderSchema = z.object({
  itemId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

/* ----------------------------- Impact metrics ----------------------------- */

export const IMPACT_METRIC_UNITS = ["count", "percentage", "currency"] as const;
export type ImpactMetricUnitInput = (typeof IMPACT_METRIC_UNITS)[number];

/** Optional ISO-4217 code: empty string normalises to `null`, otherwise upper-cased. */
const metricCurrency = z
  .string()
  .trim()
  .max(3)
  .transform((value) => (value.length === 0 ? null : value.toUpperCase()))
  .refine(
    (value) => value === null || /^[A-Z]{3}$/.test(value),
    "Use a three-letter currency code.",
  );

export const saveImpactMetricSchema = z
  .object({
    metricId: z.string().uuid().optional(),
    key: slug,
    label: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
    value: z.coerce
      .number()
      .refine((value) => Number.isFinite(value), "Enter a number.")
      .min(0, "Figures cannot be negative.")
      .max(1_000_000_000, "That figure is too large."),
    unit: z.enum(IMPACT_METRIC_UNITS),
    currency: metricCurrency,
    description: optionalText,
    sourceNote: optionalText,
    evidenceUrl: optionalUrl,
    reportingPeriod: optionalText,
    sortOrder: z.coerce.number().int().min(0).max(999),
    isPublished: z.boolean(),
  })
  .refine((metric) => metric.unit !== "currency" || metric.currency !== null, {
    message: "Choose the currency for a currency figure.",
    path: ["currency"],
  });

export const deleteImpactMetricSchema = z.object({ metricId: z.string().uuid() });

export const impactMetricPublishSchema = z.object({
  metricId: z.string().uuid(),
  isPublished: z.boolean(),
});

/* ---------------------------- Categories & tags --------------------------- */

export const saveCategorySchema = z.object({
  categoryId: z.string().uuid().optional(),
  key: slug,
  labelEn: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
});

export const saveTagSchema = z.object({
  tagId: z.string().uuid().optional(),
  key: slug,
  labelEn: z.string().trim().min(1, "Required.").max(TEXT_FIELD_MAX),
});

export const deleteCategorySchema = z.object({ categoryId: z.string().uuid() });

export const deleteTagSchema = z.object({ tagId: z.string().uuid() });

