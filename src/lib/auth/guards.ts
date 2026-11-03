import { redirect } from "next/navigation";

import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";
import { can, canAccessAdmin } from "@/lib/permissions/can";
import type { PermissionKey } from "@/lib/permissions/permissions";

export const ACCESS_DENIED_PATH = "/no-access";

/**
 * Server-side route guards.
 *
 * These run on the server for every protected render. They are the second layer
 * of defence: the middleware blocks unauthenticated `/admin` requests early, and
 * Row Level Security remains the final authority on every query.
 */

/** Require an authenticated staff member, otherwise bounce to the login page. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

/** Require an account that may enter the admin application. */
export async function requireAdmin(returnTo = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!canAccessAdmin(user)) {
    redirect(`${ACCESS_DENIED_PATH}?from=${encodeURIComponent(returnTo)}`);
  }
  return user;
}

/**
 * Require a specific permission but let the page render an explanatory panel
 * instead of redirecting, so staff keep their place in the navigation.
 */
export async function requirePermission(
  permission: PermissionKey,
  returnTo: string,
): Promise<{ user: CurrentUser; allowed: boolean }> {
  const user = await requireAdmin(returnTo);
  return { user, allowed: can(user, permission) };
}