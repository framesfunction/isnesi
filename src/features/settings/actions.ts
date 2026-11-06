"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { deleteSiteSettingSchema, saveSiteSettingSchema } from "@/lib/validation/settings";
import { fieldErrors } from "@/lib/validation/form";

function revalidateSettings(): void {
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

/**
 * Settings Server Actions.
 *
 * Guarded by `settings.manage`. Only non-secret public configuration values
 * may be stored here — secrets and API keys are managed through deployment
 * configuration, never through this interface.
 */

export async function saveSiteSettingAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("settings.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveSiteSettingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
    isPublic: formData.get("isPublic") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({
    key: input.key,
    value: input.value,
    is_public: input.isPublic,
    updated_by: user.id,
  });
  if (error) return dbErrorMessage(error, "site setting save");

  revalidateSettings();
  return actionOk("Setting saved.");
}

/* ---------------------------------- Delete ---------------------------------- */

export async function deleteSiteSettingAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("settings.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteSiteSettingSchema.safeParse({ key: formData.get("key") });
  if (!parsed.success) return actionError("Malformed request.");

  // Protect core settings from deletion.
  const protectedKeys = ["organisation", "locales", "donation"];
  if (protectedKeys.includes(parsed.data.key)) {
    return actionError("This setting cannot be deleted.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .delete()
    .eq("key", parsed.data.key);
  if (error) return dbErrorMessage(error, "site setting delete");

  revalidateSettings();
  revalidatePath("/");
  return actionOk("Setting deleted.");
}
