import { cache } from "react";

import { isPermissionKey, type PermissionKey } from "@/lib/permissions/permissions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in staff member, resolved from Supabase Auth plus database RBAC.
 *
 * Permissions are resolved from `user_roles → role_permissions → permissions`,
 * honouring expired grants and the active-profile rule that
 * `app_private.has_permission()` also applies. The result is cached per request
 * so a layout and its pages share a single resolution.
 */
export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  isActive: boolean;
  roles: { id: string; key: string; name: string }[];
  permissions: PermissionKey[];
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const base: CurrentUser = {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? user.email ?? null,
    isActive: profile?.is_active ?? false,
    roles: [],
    permissions: [],
  };

  // A missing profile row means the auth trigger has not provisioned the user
  // yet; treat that as inactive rather than granting access.
  if (!profile?.is_active) return base;

  const now = Date.now();
  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select("role_id, expires_at")
    .eq("user_id", user.id);

  const activeRoleIds = (userRoleRows ?? [])
    .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
    .map((row) => row.role_id);

  if (activeRoleIds.length === 0) return base;

  const { data: roleRows } = await supabase
    .from("roles")
    .select("id, key, name")
    .in("id", activeRoleIds);

  const { data: rolePermissionRows } = await supabase
    .from("role_permissions")
    .select("role_id, permission_id")
    .in("role_id", activeRoleIds);

  const permissionIds = [...new Set((rolePermissionRows ?? []).map((row) => row.permission_id))];

  let permissions: PermissionKey[] = [];
  if (permissionIds.length > 0) {
    const { data: permissionRows } = await supabase
      .from("permissions")
      .select("id, key")
      .in("id", permissionIds);

    permissions = (permissionRows ?? [])
      .map((row) => row.key)
      .filter((key): key is PermissionKey => isPermissionKey(key));
  }

  return {
    ...base,
    roles: roleRows ?? [],
    permissions,
  };
});