/**
 * Typed model of the ISNESI Postgres schema (the `public` API schema).
 *
 * The `Row` types below are transcribed from `supabase/migrations` and are the
 * authoritative shape used by application code. `Insert`/`Update` are derived so
 * that columns with database defaults stay optional.
 *
 * NOTE: when Docker or a linked Supabase project is available, regenerate the
 * full generated types (which also include relationship metadata for nested
 * selects) with:
 *
 *     npm run db:types        # writes src/types/database.gen.ts
 *
 * The private `safeguarding` schema is intentionally absent: it is not exposed
 * through the API and must only be reached from server-side Edge Functions.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export type ContentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected"
  | "archived";

export type EnquiryStatus =
  | "new"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "waiting"
  | "closed"
  | "spam";

export type PaymentStatus =
  | "created"
  | "pending"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type ConsentStatus = "granted" | "withdrawn" | "expired";

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

export type Database = {
  public: {
    Tables: {
      /* ------------------------------ Identity & RBAC ---------------------- */
      profiles: Table<
        {
          id: string;
          display_name: string | null;
          phone: string | null;
          avatar_path: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        "display_name" | "phone" | "avatar_path" | "is_active" | "created_at" | "updated_at"
      >;
      roles: Table<
        {
          id: string;
          key: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        },
        "id" | "description" | "is_system" | "created_at"
      >;
      permissions: Table<
        { id: string; key: string; description: string | null },
        "id" | "description"
      >;
      role_permissions: Table<{ role_id: string; permission_id: string }>;
      user_roles: Table<
        {
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          assigned_at: string;
          expires_at: string | null;
        },
        "assigned_by" | "assigned_at" | "expires_at"
      >;
      audit_events: Table<
        {
          id: number;
          actor_id: string | null;
          action: string;
          table_name: string;
          record_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          metadata: Json;
          created_at: string;
        },
        "id" | "actor_id" | "record_id" | "old_data" | "new_data" | "metadata" | "created_at"
      >;

      /* ---------------------------------- CMS ------------------------------ */
      site_settings: Table<
        {
          key: string;
          value: Json;
          is_public: boolean;
          updated_by: string | null;
          updated_at: string;
        },
        "value" | "is_public" | "updated_by" | "updated_at"
      >;
      pages: Table<
        {
          id: string;
          slug: string;
          page_type: string;
          status: ContentStatus;
          template_key: string | null;
          show_in_navigation: boolean;
          sort_order: number;
          published_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "page_type"
        | "status"
        | "template_key"
        | "show_in_navigation"
        | "sort_order"
        | "published_at"
        | "created_by"
        | "updated_by"
        | "created_at"
        | "updated_at"
      >;
      page_translations: Table<
        {
          id: string;
          page_id: string;
          locale: string;
          title: string;
          excerpt: string | null;
          seo_title: string | null;
          seo_description: string | null;
          canonical_url: string | null;
          body: Json;
        },
        "id" | "excerpt" | "seo_title" | "seo_description" | "canonical_url" | "body"
      >;
      page_sections: Table<
        {
          id: string;
          page_id: string;
          section_key: string;
          section_type: string;
          sort_order: number;
          is_enabled: boolean;
          config: Json;
          created_at: string;
        },
        "id" | "sort_order" | "is_enabled" | "config" | "created_at"
      >;

      /* ------------------------------- Editorial --------------------------- */
      content_items: Table<
        {
          id: string;
          content_type: ContentType;
          slug: string;
          status: ContentStatus;
          author_id: string | null;
          reviewer_id: string | null;
          published_at: string | null;
          scheduled_at: string | null;
          featured: boolean;
          allow_comments: boolean;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "status"
        | "author_id"
        | "reviewer_id"
        | "published_at"
        | "scheduled_at"
        | "featured"
        | "allow_comments"
        | "created_at"
        | "updated_at"
      >;
      content_translations: Table<
        {
          id: string;
          content_id: string;
          locale: string;
          title: string;
          excerpt: string | null;
          body: Json;
          seo_title: string | null;
          seo_description: string | null;
        },
        "id" | "excerpt" | "body" | "seo_title" | "seo_description"
      >;
      content_revisions: Table<
        {
          id: number;
          content_id: string;
          revision_no: number;
          snapshot: Json;
          changed_by: string | null;
          change_note: string | null;
          created_at: string;
        },
        "id" | "changed_by" | "change_note" | "created_at"
      >;
      content_approvals: Table<
        {
          id: string;
          content_id: string;
          revision_id: number;
          reviewer_id: string;
          decision: ContentApprovalDecision;
          note: string | null;
          decided_at: string;
        },
        "id" | "note" | "decided_at"
      >;
      categories: Table<{ id: string; key: string; created_at: string }, "id" | "created_at">;
      category_translations: Table<{ category_id: string; locale: string; label: string }>;
      tags: Table<{ id: string; key: string }, "id">;
      tag_translations: Table<{ tag_id: string; locale: string; label: string }>;
      content_categories: Table<{ content_id: string; category_id: string }>;
      content_tags: Table<{ content_id: string; tag_id: string }>;
      content_relationships: Table<
        { source_id: string; target_id: string; relationship: string },
        "relationship"
      >;
      /* ---------------------------- Programmes ----------------------------- */
      programmes: Table<
        {
          id: string;
          key: string;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        "id" | "icon" | "sort_order" | "is_active" | "created_at" | "updated_at"
      >;
      programme_translations: Table<
        {
          programme_id: string;
          locale: string;
          title: string;
          summary: string | null;
          body: Json;
        },
        "summary" | "body"
      >;

      /* --------------------------- Navigation ------------------------------ */
      navigation_menus: Table<{ id: string; key: string; label: string }, "id">;
      navigation_items: Table<
        {
          id: string;
          menu_id: string;
          parent_id: string | null;
          label: string;
          href: string;
          sort_order: number;
          is_visible: boolean;
          open_new_tab: boolean;
        },
        "id" | "parent_id" | "sort_order" | "is_visible" | "open_new_tab"
      >;

      /* -------------------------- Media & partners ------------------------- */
      media_assets: Table<
        {
          id: string;
          bucket_id: string;
          object_path: string;
          file_name: string;
          mime_type: string | null;
          byte_size: number | null;
          width: number | null;
          height: number | null;
          alt_text: string | null;
          caption: string | null;
          credit: string | null;
          rights_status: RightsStatus;
          rights_reference: string | null;
          consent_reference: string | null;
          safeguarding_reviewed: boolean;
          uploaded_by: string | null;
          created_at: string;
        },
        | "id"
        | "bucket_id"
        | "mime_type"
        | "byte_size"
        | "width"
        | "height"
        | "alt_text"
        | "caption"
        | "credit"
        | "rights_status"
        | "rights_reference"
        | "consent_reference"
        | "safeguarding_reviewed"
        | "uploaded_by"
        | "created_at"
      >;
      media_usage: Table<
        { media_id: string; entity_type: string; entity_id: string; usage_role: string },
        "usage_role"
      >;
      partners: Table<
        {
          id: string;
          name: string;
          relationship_type: string | null;
          website_url: string | null;
          logo_media_id: string | null;
          approval_status: PartnerApprovalStatus;
          public_visible: boolean;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "relationship_type"
        | "website_url"
        | "logo_media_id"
        | "approval_status"
        | "public_visible"
        | "approved_by"
        | "approved_at"
        | "created_at"
        | "updated_at"
      >;
      partner_translations: Table<
        { partner_id: string; locale: string; description: string | null },
        "description"
      >;

      /* ------------------------- Enquiries & finance ----------------------- */
      general_enquiries: Table<
        {
          id: string;
          reference_code: string;
          enquiry_type: EnquiryType;
          full_name: string;
          email: string | null;
          phone: string | null;
          message: string;
          status: EnquiryStatus;
          assigned_to: string | null;
          source: string;
          consent_to_contact: boolean;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        },
        | "id"
        | "reference_code"
        | "email"
        | "phone"
        | "status"
        | "assigned_to"
        | "source"
        | "consent_to_contact"
        | "created_at"
        | "updated_at"
        | "closed_at"
      >;
      enquiry_notes: Table<
        { id: string; enquiry_id: string; author_id: string | null; note: string; created_at: string },
        "id" | "author_id" | "created_at"
      >;
      donation_campaigns: Table<
        {
          id: string;
          key: string;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
        },
        "id" | "is_active" | "starts_at" | "ends_at" | "created_at"
      >;
      donation_campaign_translations: Table<
        { campaign_id: string; locale: string; title: string; description: string | null },
        "description"
      >;
      donations: Table<
        {
          id: string;
          public_reference: string;
          donor_name: string | null;
          donor_email: string | null;
          amount_minor: number;
          currency: string;
          donation_type: DonationType;
          campaign_id: string | null;
          payment_status: PaymentStatus;
          provider_key: string | null;
          provider_transaction_id: string | null;
          is_anonymous: boolean;
          receipt_number: string | null;
          paid_at: string | null;
          created_at: string;
        },
        | "id"
        | "public_reference"
        | "donor_name"
        | "donor_email"
        | "currency"
        | "donation_type"
        | "campaign_id"
        | "payment_status"
        | "provider_key"
        | "provider_transaction_id"
        | "is_anonymous"
        | "receipt_number"
        | "paid_at"
        | "created_at"
      >;
      payment_events: Table<
        {
          id: number;
          donation_id: string | null;
          provider_key: string;
          provider_event_id: string;
          event_type: string;
          signature_valid: boolean;
          payload: Json;
          processed_at: string | null;
          created_at: string;
        },
        "id" | "donation_id" | "signature_valid" | "payload" | "processed_at" | "created_at"
      >;
      donation_refunds: Table<
        {
          id: string;
          donation_id: string;
          amount_minor: number;
          reason: string | null;
          provider_refund_id: string | null;
          status: RefundStatus;
          requested_by: string | null;
          created_at: string;
        },
        "id" | "reason" | "provider_refund_id" | "status" | "requested_by" | "created_at"
      >;
      finance_reconciliations: Table<
        {
          id: string;
          period_start: string;
          period_end: string;
          provider_key: string | null;
          statement_reference: string | null;
          total_minor: number;
          currency: string;
          status: ReconciliationStatus;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        },
        | "id"
        | "provider_key"
        | "statement_reference"
        | "total_minor"
        | "currency"
        | "status"
        | "notes"
        | "created_by"
        | "created_at"
      >;
      /* ------------------------------ Newsletter --------------------------- */
      newsletter_subscribers: Table<
        {
          id: string;
          email: string;
          full_name: string | null;
          status: NewsletterSubscriberStatus;
          locale: string;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
        },
        | "id"
        | "full_name"
        | "status"
        | "locale"
        | "confirmed_at"
        | "unsubscribed_at"
        | "created_at"
      >;
      newsletter_consents: Table<
        {
          id: string;
          subscriber_id: string;
          status: ConsentStatus;
          source: string;
          policy_version: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          recorded_at: string;
        },
        "id" | "policy_version" | "ip_hash" | "user_agent" | "recorded_at"
      >;
      newsletter_campaigns: Table<
        {
          id: string;
          name: string;
          subject: string;
          body: Json;
          status: NewsletterCampaignStatus;
          scheduled_at: string | null;
          sent_at: string | null;
          created_by: string | null;
          created_at: string;
        },
        "id" | "body" | "status" | "scheduled_at" | "sent_at" | "created_by" | "created_at"
      >;
      newsletter_events: Table<
        {
          id: number;
          campaign_id: string | null;
          subscriber_id: string | null;
          event_type: NewsletterEventType;
          provider_event_id: string | null;
          occurred_at: string;
        },
        "id" | "campaign_id" | "subscriber_id" | "provider_event_id" | "occurred_at"
      >;

      /* ----------------------------- Kids' Corner -------------------------- */
      kids_resources: Table<
        {
          id: string;
          resource_type: KidsResourceType;
          status: ContentStatus;
          min_age: number | null;
          max_age: number | null;
          is_featured: boolean;
          safeguarding_approved: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        | "id"
        | "status"
        | "min_age"
        | "max_age"
        | "is_featured"
        | "safeguarding_approved"
        | "created_by"
        | "created_at"
        | "updated_at"
      >;
      kids_resource_translations: Table<
        {
          resource_id: string;
          locale: string;
          title: string;
          description: string | null;
          content: Json;
        },
        "description" | "content"
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      content_status: ContentStatus;
      enquiry_status: EnquiryStatus;
      payment_status: PaymentStatus;
      consent_status: ConsentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

/* -------------------------------------------------------------------------- */
/* Convenience aliases                                                        */
/* -------------------------------------------------------------------------- */

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type DonationType = "one_time" | "recurring";

export type ReconciliationStatus = "open" | "in_review" | "reconciled" | "disputed";

export type RefundStatus = "requested" | "succeeded" | "failed";

/* -------------------------------------------------------------------------- */
/* Derivation helpers                                                         */
/* -------------------------------------------------------------------------- */

/** Columns that the database fills in itself are optional on insert. */
type Insertable<Row, Optional extends keyof Row> = Omit<Row, Optional> &
  Partial<Pick<Row, Optional>>;

type Table<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Insertable<Row, Optional>;
  Update: Partial<Row>;
  Relationships: [];
};
