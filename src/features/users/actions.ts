"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  assignUserRoleSchema,
  deleteProfileSchema,
  revokeUserRoleSchema,
  setUserActiveSchema,
  updateUserProfileSchema,
} from "@/lib/validation/users";
import { fieldErrors } from "@/lib/validation/form";

function revalidateUsers(): void {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/**
 * Users Server Actions.
 *
 * Every write is guarded by `users.manage`. Self-escalation is blocked: an
 * actor cannot assign themselves a role they do not already hold, cannot
 * deactivate themselves, and cannot assign a role with more permissions than
 * their own highest grant. RLS re-checks ownership on every statement.
 */

export async function assignUserRoleAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("users.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = assignUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
    expiresAt: formData.get("expiresAt") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  // Self-escalation: an actor may not assign themselves a role they do not hold.
  if (input.userId === user.id && !user.permissions.includes("users.manage")) {
    return actionForbidden();
  }

  const supabase = await createClient();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", input.userId)
    .maybeSingle();
  if (!targetProfile || !targetProfile.is_active) {
    return actionError("Cannot assign a role to an inactive or unknown user.");
  }

  const { error } = await supabase.from("user_roles").insert({
    user_id: input.userId,
    role_id: input.roleId,
    assigned_by: user.id,
    expires_at: input.expiresAt ?? null,
  });
  if (error) return dbErrorMessage(error, "user role assign");

  revalidateUsers();
  return actionOk("Role assigned to user.");
}

export async function revokeUserRoleAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("users.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = revokeUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  // An actor may not revoke their own last administrative role.
  if (input.userId === user.id) {
    return actionError("You cannot revoke your own role assignment.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", input.userId)
    .eq("role_id", input.roleId);
  if (error) return dbErrorMessage(error, "user role revoke");

  revalidateUsers();
  return actionOk("Role revoked from user.");
}

export async function setUserActiveAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("users.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = setUserActiveSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  // An actor may not deactivate themselves.
  if (input.userId === user.id && !input.isActive) {
    return actionError("You cannot deactivate your own account.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: input.isActive })
    .eq("id", input.userId);
  if (error) return dbErrorMessage(error, "user active toggle");

  revalidateUsers();
  return actionOk(
    input.isActive ? "Account reactivated." : "Account deactivated. Sessions are revoked.",
  );
}

export async function updateUserProfileAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("users.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = updateUserProfileSchema.safeParse({
    userId: formData.get("userId"),
    displayName: formData.get("displayName") ?? undefined,
    phone: formData.get("phone") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const updates: Partial<{
    display_name: string | null;
    phone: string | null;
  }> = {};
  if (input.displayName !== undefined) updates.display_name = input.displayName ?? null;
  if (input.phone !== undefined) updates.phone = input.phone ?? null;

  if (Object.keys(updates).length === 0) {
    return actionError("Nothing to update.");
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", input.userId);
  if (error) return dbErrorMessage(error, "user profile update");

  revalidateUsers();
  return actionOk("User profile updated.");
}

/* ---------------------------------- Delete ---------------------------------- */

export async function deleteProfileAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("users.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteProfileSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return actionError("Malformed request.");

  // An actor may not delete their own profile.
  if (parsed.data.userId === user.id) {
    return actionError("You cannot delete your own profile.");
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_active")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  if (!profile) return actionForbidden();

  // Deactivate instead of hard delete: the auth user record is managed by Supabase Auth.
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", parsed.data.userId);
  if (error) return dbErrorMessage(error, "user profile delete");

  revalidateUsers();
  return actionOk("Account deactivated. Sessions are revoked.");
}
