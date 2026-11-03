import { z } from "zod";

/**
 * Shared validation schemas.
 *
 * One schema is used by the client form (React Hook Form) and again by the
 * Server Action, so the browser can never submit data the server would not
 * accept.
 */

export const ENQUIRY_TYPES = ["volunteer", "partnership", "contact", "media", "other"] as const;
export type EnquiryTypeInput = (typeof ENQUIRY_TYPES)[number];

export const enquirySchema = z.object({
  enquiryType: z.enum(ENQUIRY_TYPES),
  fullName: z.string().trim().min(2, "Please enter your full name").max(120, "Name is too long"),
  email: z
    .string()
    .trim()
    .max(254, "Email is too long")
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(32, "Phone number is too long")
    .regex(/^[+()\d\s-]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(20, "Please give us at least 20 characters so we can help")
    .max(4000, "Please keep your message under 4000 characters"),
  consentToContact: z.boolean(),
  // Honeypot: real users never fill this hidden field in.
  companyWebsite: z.string().max(0, "Unexpected value").optional().or(z.literal("")),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const NEWSLETTER_SOURCES = ["website", "event", "partner_referral"] as const;

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().max(254).email("Enter a valid email address"),
  fullName: z.string().trim().max(120).optional().or(z.literal("")),
  consent: z.boolean(),
  locale: z.enum(["en", "fr"]).default("en"),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

/**
 * `fieldErrors` now lives in `lib/validation/form.ts` so every module shares one
 * implementation. Re-exported here so existing imports keep working.
 */
export { fieldErrors } from "@/lib/validation/form";