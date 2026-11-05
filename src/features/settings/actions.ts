"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { saveSiteSettingSchema } from "@/lib/validation/settings";
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
