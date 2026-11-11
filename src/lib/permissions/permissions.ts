/**
 * Permission catalogue.
 *
 * These keys are the single source of truth shared with the database
 * (`public.permissions.key`). Adding or renaming a permission requires a
 * migration, a change here, and a change in `supabase/seed.sql` if it is part of
 * the default role bundles.
 */
export const PERMISSIONS = [
  "admin.access",
  "users.manage",
  "settings.manage",
  "pages.manage",
  "content.create",
  "content.edit_any",
  "content.review",
  "content.publish",
  "programmes.manage",
  "media.manage",
  "partners.manage",
  "centers.manage",
  "enquiries.manage",
  "donations.read",
  "donations.manage",
  "newsletter.manage",
  "kids.manage",
  "safeguarding.access",
  "safeguarding.lead",
  "audit.read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "admin.access": "Access the admin application",
  "users.manage": "Manage users and role assignments",
  "settings.manage": "Manage site settings",
  "pages.manage": "Create and manage pages",
  "content.create": "Create content",
  "content.edit_any": "Edit any content",
  "content.review": "Review and approve content",
  "content.publish": "Publish and unpublish content",
  "programmes.manage": "Manage programmes",
  "media.manage": "Manage media and rights",
  "partners.manage": "Manage partner profiles",
  "centers.manage": "Manage center locations",
  "enquiries.manage": "Manage general enquiries",
  "donations.read": "Read donation records",
  "donations.manage": "Manage donations and reconciliation",
  "newsletter.manage": "Manage subscribers and campaigns",
  "kids.manage": "Manage Kids' Corner resources",
  "safeguarding.access": "Access safeguarding casework through approved server functions",
  "safeguarding.lead": "Safeguarding lead permissions",
  "audit.read": "Read audit logs",
};

export const ROLE_KEYS = [
  "super_admin",
  "website_admin",
  "content_editor",
  "content_contributor",
  "communications_officer",
  "finance_officer",
  "safeguarding_officer",
  "safeguarding_lead",
  "media_manager",
  "programme_manager",
  "auditor",
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: "Super Administrator",
  website_admin: "Website Administrator",
  content_editor: "Content Editor",
  content_contributor: "Content Contributor",
  communications_officer: "Communications Officer",
  finance_officer: "Finance Officer",
  safeguarding_officer: "Safeguarding Officer",
  safeguarding_lead: "Safeguarding Lead",
  media_manager: "Media Manager",
  programme_manager: "Programme Manager",
  auditor: "Auditor / Compliance Reviewer",
};

/** Narrow an arbitrary string (for example from the database) to a known key. */
export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function isRoleKey(value: string): value is RoleKey {
  return (ROLE_KEYS as readonly string[]).includes(value);
}

export function permissionLabel(key: string): string {
  return isPermissionKey(key) ? PERMISSION_LABELS[key] : key;
}

export function roleLabel(key: string): string {
  return isRoleKey(key) ? ROLE_LABELS[key] : key;
}
