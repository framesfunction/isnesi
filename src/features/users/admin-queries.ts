import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminUserListItem = {
  id: string;
  email: string | null;
  displayName: string | null;
  isActive: boolean;
  roles: string[];
  lastSignInAt: string | null;
  updatedAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  phone: string | null;
  createdAt: string;
  roleGrants: Array<{
    roleId: string;
    roleKey: string;
    roleName: string;
    assignedAt: string | null;
    expiresAt: string | null;
    assignedBy: string | null;
  }>;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  is_active: boolean;
  updated_at: string;
};

type ProfileDetailRow = {
  id: string;
  display_name: string | null;
  is_active: boolean;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

function toListItem(row: ProfileRow, roles: string[]): AdminUserListItem {
  return {
    id: row.id,
    email: null,
    displayName: row.display_name ?? null,
    isActive: row.is_active,
    roles,
    lastSignInAt: null,
    updatedAt: row.updated_at,
  };
}

export async function listAdminUsers(): Promise<AdminUserListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, is_active, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[isnesi] admin users unavailable", { code: error.code });
    return null;
  }

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id, role_id")
    .in("user_id", ids);

  const roleIds = [...new Set((userRoles ?? []).map((r) => r.role_id))];
  let roleMap = new Map<string, string>();
  if (roleIds.length > 0) {
    const { data: roles } = await supabase.from("roles").select("id, key").in("id", roleIds);
    roleMap = new Map((roles ?? []).map((r) => [r.id, r.key]));
  }

  const userRolesByUser = new Map<string, string[]>();
  for (const ur of userRoles ?? []) {
    const key = roleMap.get(ur.role_id) ?? ur.role_id;
    const existing = userRolesByUser.get(ur.user_id) ?? [];
    userRolesByUser.set(ur.user_id, [...existing, key]);
  }

  return (profiles ?? []).map((row) =>
    toListItem(row as unknown as ProfileRow, userRolesByUser.get(row.id) ?? []),
  );
}

export async function getAdminUser(userId: string): Promise<AdminUserDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, is_active, phone, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin user unavailable", { userId, code: error.code });
    return null;
  }
  if (!profile) return null;

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role_id, assigned_at, expires_at, assigned_by")
    .eq("user_id", userId);

  const roleIds = [...new Set((userRoles ?? []).map((r) => r.role_id))];
  let roleMap = new Map<string, { key: string; name: string }>();
  if (roleIds.length > 0) {
    const { data: roles } = await supabase.from("roles").select("id, key, name").in("id", roleIds);
    roleMap = new Map(
      (roles ?? []).map((r) => [r.id, { key: r.key, name: r.name }]),
    );
  }

  const roleGrants = (userRoles ?? []).map((ur) => {
    const role = roleMap.get(ur.role_id);
    return {
      roleId: ur.role_id,
      roleKey: role?.key ?? ur.role_id,
      roleName: role?.name ?? "Unknown role",
      assignedAt: ur.assigned_at,
      expiresAt: ur.expires_at,
      assignedBy: ur.assigned_by,
    };
  });

  const roles = roleGrants.map((g) => g.roleKey);

  return {
    ...toListItem(profile as unknown as ProfileRow, roles),
    phone: (profile as unknown as ProfileDetailRow).phone ?? null,
    createdAt: (profile as unknown as ProfileDetailRow).created_at,
    roleGrants,
  };
}

export async function listAdminRoles() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, key, name, description, is_system")
    .order("key", { ascending: true });
  if (error) return null;
  return data ?? [];
}

export async function listAdminPermissions() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("permissions")
    .select("id, key, description")
    .order("key", { ascending: true });
  if (error) return null;
  return data ?? [];
}
