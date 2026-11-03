import type { PermissionKey } from "@/lib/permissions/permissions";

/**
 * A subject's effective access, resolved server-side from the database.
 * Mirrors `app_private.has_permission()`: an inactive profile has no access, and
 * expired role grants are ignored.
 */
export type AccessSubject = {
  isActive: boolean;
  permissions: readonly string[];
};

/**
 * Pure permission checks.
 *
 * These are used for navigation and interface affordances only. Every mutation
 * is re-checked on the server and enforced again by Row Level Security; hiding
 * a control is never treated as a security control.
 */
export function can(
  subject: AccessSubject | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!subject || !subject.isActive) return false;
  return subject.permissions.includes(permission);
}

export function canAny(
  subject: AccessSubject | null | undefined,
  permissions: readonly PermissionKey[],
): boolean {
  return permissions.some((permission) => can(subject, permission));
}

export function canAll(
  subject: AccessSubject | null | undefined,
  permissions: readonly PermissionKey[],
): boolean {
  // A deactivated or missing account must never satisfy a permission check, even
  // for an empty requirement list.
  if (!subject || !subject.isActive) return false;
  return permissions.every((permission) => subject.permissions.includes(permission));
}

export function canAccessAdmin(subject: AccessSubject | null | undefined): boolean {
  return can(subject, "admin.access");
}
