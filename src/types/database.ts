/**
 * Application-facing model of the ISNESI Postgres schema.
 *
 * `Database` — the row/column model used by the Supabase clients — is
 * generated from the live schema with `npm run db:types` (which writes
 * `./database.gen.ts`) and is never edited by hand. This file re-exports it
 * along with hand-curated unions for text columns that have a fixed value
 * set, so application code stays strongly typed without extra DB enums.
 */

import type { Database as GeneratedDatabase, Enums } from "./database.gen";

export type Database = GeneratedDatabase;

export type { Tables, TablesInsert, TablesUpdate, Enums, Json } from "./database.gen";

/* ---------------------------- Real DB enums ------------------------------- */

export type ContentStatus = Enums<"content_status">;

export type EnquiryStatus = Enums<"enquiry_status">;

export type PaymentStatus = Enums<"payment_status">;

export type ConsentStatus = Enums<"consent_status">;

/* ------------------------- Hand-curated value sets ------------------------ */

export type ContentType = "story" | "news" | "announcement" | "policy";

export type EnquiryType = "volunteer" | "partnership" | "contact" | "media" | "other";

export type RightsStatus =
  | "pending"
  | "owned"
  | "licensed"
  | "permission_recorded"
  | "restricted"
  | "expired";

export type PartnerApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export type NewsletterSubscriberStatus = "pending" | "subscribed" | "unsubscribed" | "suppressed";

export type NewsletterEventType =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "opened"
  | "clicked"
  | "unsubscribed";

export type NewsletterCampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";

export type KidsResourceType = "story" | "activity" | "game" | "video" | "download";

export type ContentApprovalDecision = "approved" | "rejected" | "changes_requested";

export type DonationType = "one_time" | "recurring";

export type ReconciliationStatus = "open" | "in_review" | "reconciled" | "disputed";

export type RefundStatus = "requested" | "succeeded" | "failed";
