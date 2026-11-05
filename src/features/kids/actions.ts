"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  deleteKidsResourceSchema,
  kidsResourceReviewSchema,
  kidsResourceToggleSchema,
  saveKidsResourceSchema,
} from "@/lib/validation/kids";
import { fieldErrors } from "@/lib/validation/form";

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidateKids(): void {
  revalidatePath("/admin/kids-corner");
  revalidatePath("/kids");
  revalidatePath("/");
}

/**
 * Kids' Corner Server Actions.
 *
 * Every write is guarded by `kids.manage`. The critical control is the
 * safeguarding gate: a resource can only be published when
 * `safeguarding_approved` is true, and only a reviewer with `kids.manage`
 * can flip that flag. RLS re-checks both on every statement.
 */

export async function saveKidsResourceAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ resourceId: string }>> {
  const user = await assertPermission("kids.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveKidsResourceSchema.safeParse({
    resourceId: optionalId(formData.get("resourceId")),
    resourceType: formData.get("resourceType"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    minAge: formData.get("minAge") ?? "",
    maxAge: formData.get("maxAge") ?? "",
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  const itemValues = {
    resource_type: input.resourceType,
    min_age: input.minAge ?? null,
    max_age: input.maxAge ?? null,
    is_featured: input.featured,
    status: "draft" as const,
    safeguarding_approved: false,
  };

  let resourceId: string;
  if (input.resourceId) {
    const { data, error } = await supabase
      .from("kids_resources")
      .update(itemValues)
      .eq("id", input.resourceId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "kids resource update");
    if (!data) return actionForbidden();
    resourceId = data.id;
  } else {
    const { data, error } = await supabase
      .from("kids_resources")
      .insert({ ...itemValues, created_by: user.id })
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "kids resource create");
    resourceId = data.id;
  }

  const { error } = await supabase.from("kids_resource_translations").upsert(
    {
      resource_id: resourceId,
      locale: "en",
      title: input.title,
      description: input.description ?? null,
    },
    { onConflict: "resource_id,locale" },
  );
  if (error) return dbErrorMessage(error, "kids resource translation save");

  revalidateKids();
  return actionOk("Kids resource saved. Submit it for safeguarding review before publishing.", {
    resourceId,
  });
}

export async function reviewKidsResourceAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("kids.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = kidsResourceReviewSchema.safeParse({
    resourceId: formData.get("resourceId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { data: resource } = await supabase
    .from("kids_resources")
    .select("id, status, safeguarding_approved")
    .eq("id", input.resourceId)
    .maybeSingle();
  if (!resource) return actionForbidden();

  const approved = input.decision === "approve";
  const { error } = await supabase
    .from("kids_resources")
    .update({
      safeguarding_approved: approved,
      status: approved ? "approved" : "rejected",
    })
    .eq("id", input.resourceId);
  if (error) return dbErrorMessage(error, "kids resource review");

  revalidateKids();
  return actionOk(
    approved
      ? "Approved. Safeguarding clearance recorded; the resource can now be published."
      : "Rejected. It cannot be published until safeguarding concerns are resolved.",
  );
}

export async function toggleKidsFeaturedAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("kids.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = kidsResourceToggleSchema.safeParse({
    resourceId: formData.get("resourceId"),
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) return actionError("Malformed request.");

  // A featured resource must be safeguarding-approved before it can be shown publicly.
  const supabase = await createClient();
  const { data: resource } = await supabase
    .from("kids_resources")
    .select("id, safeguarding_approved")
    .eq("id", parsed.data.resourceId)
    .maybeSingle();
  if (!resource) return actionForbidden();
  if (parsed.data.featured && !resource.safeguarding_approved) {
    return actionError("Only safeguarding-approved resources can be featured.");
  }

  const { error } = await supabase
    .from("kids_resources")
    .update({ is_featured: parsed.data.featured })
    .eq("id", parsed.data.resourceId);
  if (error) return dbErrorMessage(error, "kids resource featured toggle");

  revalidateKids();
  return actionOk(
    parsed.data.featured ? "Resource marked as featured." : "Featured flag removed.",
  );
}

export async function deleteKidsResourceAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("kids.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteKidsResourceSchema.safeParse({ resourceId: formData.get("resourceId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase.from("kids_resources").delete().eq("id", parsed.data.resourceId);
  if (error) return dbErrorMessage(error, "kids resource delete");

  revalidateKids();
  return actionOk("Kids resource deleted.");
}
