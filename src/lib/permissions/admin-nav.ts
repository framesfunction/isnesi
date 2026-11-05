import { can, canAccessAdmin, type AccessSubject } from "@/lib/permissions/can";
import type { PermissionKey } from "@/lib/permissions/permissions";

/**
 * Declarative description of the admin application.
 *
 * A single source of truth drives the sidebar, the route guards, the dashboard
 * quick links and the scaffold pages. Modules graduate from "planned" to
 * "implemented" by replacing `AdminModuleScaffold` with real CRUD screens; the
 * metadata here stays valid.
 */

export type AdminNavGroupKey = "overview" | "website" | "engagement" | "administration";

export type AdminModuleKey =
  | "dashboard"
  | "pages"
  | "programmes"
  | "stories"
  | "media"
  | "partners"
  | "navigation"
  | "enquiries"
  | "safeguarding"
  | "donations"
  | "newsletter"
  | "kids-corner"
  | "users"
  | "settings"
  | "accessibility"
  | "audit";

export type AdminModule = {
  key: AdminModuleKey;
  label: string;
  href: string;
  /** lucide-react icon name, resolved in the presentation layer. */
  icon: string;
  group: AdminNavGroupKey;
  /** Short line used in navigation tooltips and page headers. */
  description: string;
  /** Permission required to open the module. */
  permission: PermissionKey;
  /** What the finished module is responsible for. */
  purpose: string;
  /** Database tables this module owns or reads. */
  tables: string[];
  /** Capabilities delivered by the detailed implementation plan. */
  capabilities: string[];
  /** Non-negotiable controls that must ship with this module. */
  security: string[];
};

export const ADMIN_NAV_GROUPS: { key: AdminNavGroupKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "website", label: "Website management" },
  { key: "engagement", label: "People & engagement" },
  { key: "administration", label: "Administration" },
];

export const ADMIN_MODULES: AdminModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: "layout-dashboard",
    group: "overview",
    description: "Operational overview of the website and workflows",
    permission: "admin.access",
    purpose:
      "Give every staff member a permission-aware overview of content, enquiries, finance indicators and system health.",
    tables: ["pages", "content_items", "general_enquiries", "donations", "newsletter_subscribers"],
    capabilities: [
      "Published, draft, in-review and scheduled content counts",
      "Open and unassigned enquiry workload with assignment shortcuts",
      "Aggregated safeguarding workload indicators (counts only, never case detail)",
      "Donation totals, reconciliation status and pending approvals",
      "Newsletter subscriber totals and recent campaign activity",
      "Integration health, backup status, security alerts and launch warnings",
      "Date-range filters, quick links and exportable operational reports",
    ],
    security: [
      "No child names, referral narratives or medical detail on the dashboard",
      "Safeguarding workload is aggregated and further restricted by role",
      "Exports are permission-checked, audited and never include restricted data",
    ],
  },
  {
    key: "pages",
    label: "Pages & sections",
    href: "/admin/pages",
    icon: "layout-template",
    group: "website",
    description: "Public pages, sections, SEO and publication state",
    permission: "pages.manage",
    purpose:
      "Manage every public page, its ordered sections, navigation placement and publication status.",
    tables: ["pages", "page_translations", "page_sections"],
    capabilities: [
      "Create, edit, reorder, hide and archive pages",
      "Structured section editing (section_type plus validated section config)",
      "Translation status",
      "SEO title, description, canonical URL and open-graph fields",
      "Draft to review to scheduled to published workflow with timestamps",
      "Redirect suggestion when a slug changes",
    ],
    security: [
      "Section content holds validated structured data, never executable HTML",
      "Publication requires the content.publish permission",
      "Archiving cannot orphan navigation links",
    ],
  },
  {
    key: "programmes",
    label: "Programmes",
    href: "/admin/programmes",
    icon: "sparkles",
    group: "website",
    description: "Programme areas shown on the public website",
    permission: "programmes.manage",
    purpose: "Maintain the programme areas, their descriptions, imagery and public ordering.",
    tables: ["programmes", "programme_translations", "media_assets"],
    capabilities: [
      "Create, edit, reorder and deactivate programmes",
      "Objectives, activities, beneficiaries and geographic coverage",
      "Featured image selection from the media library",
      "Programme translations",
    ],
    security: [
      "Deletion is blocked while content, media or reporting references exist",
      "Only rights-cleared media can be attached",
    ],
  },
  {
    key: "stories",
    label: "Stories & news",
    href: "/admin/stories",
    icon: "newspaper",
    group: "website",
    description: "Stories, news, revisions and approvals",
    permission: "content.create",
    purpose:
      "Run the editorial workflow for stories, news, announcements and policy notices with a full audit trail.",
    tables: ["content_items", "content_translations", "content_revisions", "content_approvals"],
    capabilities: [
      "Editorial workflow: draft, review, approval, scheduled or published",
      "Immutable revision snapshots with restore-without-history-loss",
      "Independent approval: no self-approval where review is required",
      "Categories, tags and related-content relationships",
      "Safeguarding clearance flag for content involving children",
      "Scheduled publication and unpublishing",
    ],
    security: [
      "Publishing requires content.publish; approval requires content.review",
      "A material change after approval forces re-approval",
      "Child-related stories cannot publish without safeguarding clearance",
      "Consent, image rights and takedown contact are recorded per story",
    ],
  },
  {
    key: "media",
    label: "Media library",
    href: "/admin/media",
    icon: "images",
    group: "website",
    description: "Assets, alt text, rights and consent records",
    permission: "media.manage",
    purpose:
      "Centralise images, documents, logos and video references with accessibility and rights metadata.",
    tables: ["media_assets", "media_usage"],
    capabilities: [
      "Upload to the public-media bucket with server-side validation",
      "Alt text, caption, credit and photographer or source",
      "Rights status, licence reference and consent reference",
      "Safeguarding review flag for identifiable people and children",
      "Usage tracking so assets cannot be deleted while referenced",
    ],
    security: [
      "Sensitive documents never enter the public bucket",
      "Assets with restricted or expired rights cannot be published",
      "Uploads and deletions are audited",
    ],
  },
  {
    key: "partners",
    label: "Partners",
    href: "/admin/partners",
    icon: "handshake",
    group: "website",
    description: "Partner profiles, approvals and public visibility",
    permission: "partners.manage",
    purpose: "Manage partner organisations and their approved public representation.",
    tables: ["partners", "partner_translations", "media_assets"],
    capabilities: [
      "Partner name, relationship type, website and logo",
      "Approval workflow before public visibility",
      "Descriptions",
    ],
    security: [
      "A partner is never presented as an endorsement without recorded approval",
      "Public visibility requires approval_status of approved",
    ],
  },
  {
    key: "navigation",
    label: "Navigation & footer",
    href: "/admin/navigation",
    icon: "list-tree",
    group: "website",
    description: "Menus, ordering, visibility and footer content",
    permission: "pages.manage",
    purpose:
      "Control menus, ordering, visibility, external links and footer content without code changes.",
    tables: ["navigation_menus", "navigation_items", "site_settings"],
    capabilities: [
      "Main and footer menus with drag-order nesting",
      "Visibility toggles and new-tab behaviour",
      "Broken internal link detection after slug changes or archiving",
    ],
    security: [
      "Navigation cannot point at unpublished pages on the public site",
      "External links render with safe rel attributes",
    ],
  },
  {
    key: "enquiries",
    label: "Enquiries",
    href: "/admin/enquiries",
    icon: "mail",
    group: "engagement",
    description: "General website enquiries, assignment and responses",
    permission: "enquiries.manage",
    purpose:
      "Receive, triage, assign, answer and close ordinary website enquiries without ever mixing them with child referrals.",
    tables: ["general_enquiries", "enquiry_notes"],
    capabilities: [
      "Triage queue with statuses: new, triaged, assigned, in progress, waiting, closed, spam",
      "Assignment to a staff member with internal notes",
      "Response templates and contact history",
      "Export of ordinary enquiries only, with permissions and audit",
    ],
    security: [
      "Child referrals are never stored in general_enquiries",
      "Referral content is never included in enquiry exports or notes",
      "Public submission requires consent_to_contact and cannot set status or assignee",
    ],
  },
  {
    key: "safeguarding",
    label: "Safeguarding",
    href: "/admin/safeguarding",
    icon: "shield-check",
    group: "engagement",
    description: "Restricted casework through server-side functions only",
    permission: "safeguarding.access",
    purpose:
      "Manage restricted child referrals and casework in the private safeguarding schema with full access logging.",
    tables: [
      "safeguarding.cases",
      "safeguarding.subjects",
      "safeguarding.intake_details",
      "safeguarding.case_notes",
      "safeguarding.case_attachments",
      "safeguarding.case_access_events",
      "safeguarding.case_consents",
    ],
    capabilities: [
      "Assignment, severity, status and retention review dates",
      "Encrypted narratives and case notes",
      "Private attachments with no public URL",
      "Access and disclosure logging per case",
      "Emergency access that is justified and audited",
    ],
    security: [
      "The safeguarding schema is not an exposed API schema and has no client grants",
      "Every read and write goes through a server-side Edge Function with service role",
      "Each access is written to safeguarding.case_access_events before data is returned",
      "Ordinary administrators have no access by default, including super administrators",
      "Case content never appears in notifications, logs or audit before/after data",
    ],
  },
  {
    key: "donations",
    label: "Donations",
    href: "/admin/donations",
    icon: "hand-coins",
    group: "engagement",
    description: "Campaigns, transactions, receipts and reconciliation",
    permission: "donations.read",
    purpose:
      "Manage donation campaigns, verified transactions, receipts, refunds and reconciliation.",
    tables: [
      "donation_campaigns",
      "donations",
      "payment_events",
      "donation_refunds",
      "finance_reconciliations",
    ],
    capabilities: [
      "Campaign configuration and public visibility",
      "Transaction list with provider references and payment status",
      "Receipt numbering and issuing",
      "Refund requests with authorisation",
      "Reconciliation against provider settlements",
      "Finance reporting and export (permission-checked and audited)",
    ],
    security: [
      "A payment is never confirmed by a browser redirect",
      "Webhooks are signature-verified and processed idempotently by provider event id",
      "The service role key and provider signatures stay server-side",
      "Refunds require donations.manage and produce an audit record",
      "Card data and mobile money PINs are never stored",
    ],
  },
  {
    key: "newsletter",
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: "send",
    group: "engagement",
    description: "Subscribers, consent, campaigns and suppression",
    permission: "newsletter.manage",
    purpose:
      "Operate subscriber records, consent evidence, campaigns and suppression rules around an external delivery provider.",
    tables: [
      "newsletter_subscribers",
      "newsletter_consents",
      "newsletter_campaigns",
      "newsletter_events",
    ],
    capabilities: [
      "Subscriber list with status and consent history",
      "Double opt-in confirmation and one-click unsubscribe",
      "Campaign drafting, scheduling and delivery tracking",
      "Bounce, complaint and suppression handling",
    ],
    security: [
      "Public signup uses a rate-limited Edge Function with double opt-in",
      "Direct public insert into subscriber tables is not granted",
      "An unsubscribed or suppressed contact cannot receive a campaign",
      "Marketing consent is recorded separately from transactional messages",
    ],
  },
  {
    key: "kids-corner",
    label: "Kids' Corner",
    href: "/admin/kids-corner",
    icon: "smile",
    group: "engagement",
    description: "Child-facing resources with mandatory safeguarding review",
    permission: "kids.manage",
    purpose:
      "Manage age-appropriate, child-safe learning resources and enforce safeguarding review before publication.",
    tables: ["kids_resources", "kids_resource_translations"],
    capabilities: [
      "Resource types: story, activity, game, video and download",
      "Age range, language and learning objective",
      "Review workflow with recorded decisions",
      "Featured resource selection for the public Kids' Corner",
    ],
    security: [
      "Publications are blocked while safeguarding_approved is false",
      "The public policy only exposes published and safeguarding-approved resources",
      "External links and downloads are checked before publication",
    ],
  },
  {
    key: "users",
    label: "Users & permissions",
    href: "/admin/users",
    icon: "users",
    group: "administration",
    description: "Staff accounts, roles, invitations and security state",
    permission: "users.manage",
    purpose:
      "Manage staff accounts, role assignments, invitations, MFA state and account deactivation.",
    tables: ["profiles", "roles", "permissions", "role_permissions", "user_roles"],
    capabilities: [
      "Invite staff and track invitation expiry",
      "Assign least-privilege roles with optional expiry",
      "Deactivate accounts and revoke sessions",
      "Review effective permissions per user",
    ],
    security: [
      "Role assignment happens server-side with users.manage and an audit record",
      "Self-escalation is blocked",
      "Deactivation revokes sessions and future access",
      "MFA is required for privileged accounts",
    ],
  },
  {
    key: "settings",
    label: "Site settings",
    href: "/admin/settings",
    icon: "settings",
    group: "administration",
    description: "Organisation identity, contact details, SEO and integrations",
    permission: "settings.manage",
    purpose:
      "Manage organisation identity, contact information, SEO defaults, cookie settings, maintenance mode and integration metadata.",
    tables: ["site_settings"],
    capabilities: [
      "Public organisation details and taglines",
      "Contact details, address and opening information",
      "SEO defaults and social sharing images",
      "Cookie, spam-protection and analytics settings",
      "Maintenance mode and public-site availability",
    ],
    security: [
      "Secrets and API keys are never stored in site_settings",
      "Only settings flagged is_public are readable by anonymous visitors",
      "Every change is audited with actor and timestamp",
    ],
  },
  {
    key: "accessibility",
    label: "Accessibility",
    href: "/admin/accessibility",
    icon: "accessibility",
    group: "administration",
    description: "Inclusive experience settings and editorial checks",
    permission: "settings.manage",
    purpose:
      "Manage public accessibility options and the editorial checks required for WCAG 2.2 AA conformance.",
    tables: ["site_settings", "media_assets", "pages", "content_items"],
    capabilities: [
      "Alternate text coverage reporting",
      "Heading hierarchy and form label checks",
      "Reduced motion and contrast preferences",
      "Accessibility review records per page and story",
    ],
    security: [
      "Accessibility preferences never weaken authentication or authorisation",
      "Review records are retained as compliance evidence",
    ],
  },
  {
    key: "audit",
    label: "Audit log",
    href: "/admin/audit",
    icon: "scroll-text",
    group: "administration",
    description: "Append-only record of administrative and sensitive access",
    permission: "audit.read",
    purpose:
      "Review who changed what, when, from where and which restricted records were accessed.",
    tables: ["audit_events"],
    capabilities: [
      "Filter by actor, table, action and date range",
      "Login, role, content, finance and safeguarding access events",
      "Export for compliance review",
    ],
    security: [
      "audit_events is append-only: clients cannot insert, update or delete",
      "Sensitive values are hashed or redacted, never copied into audit rows",
      "Audit access itself is restricted and recorded",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function getAdminModule(key: string): AdminModule | undefined {
  return ADMIN_MODULES.find((module) => module.key === key);
}

/**
 * Modules the subject may open. A subject without `admin.access` sees nothing,
 * and each module additionally requires its own permission.
 */
export function visibleAdminModules(subject: AccessSubject | null | undefined): AdminModule[] {
  if (!canAccessAdmin(subject)) return [];
  return ADMIN_MODULES.filter((module) => can(subject, module.permission));
}

export function groupedAdminNavigation(
  subject: AccessSubject | null | undefined,
): { group: AdminNavGroupKey; label: string; modules: AdminModule[] }[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    group: group.key,
    label: group.label,
    modules: visibleAdminModules(subject).filter((module) => module.group === group.key),
  })).filter((group) => group.modules.length > 0);
}

export function canOpenModule(
  subject: AccessSubject | null | undefined,
  moduleKey: AdminModuleKey,
): boolean {
  const target = getAdminModule(moduleKey);
  return target ? can(subject, target.permission) : false;
}
