"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  actionForbidden,
  actionNotConfigured,
  actionOk,
} from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import {
  deleteCategorySchema,
  deleteTagSchema,
  saveCategorySchema,
  saveTagSchema,
} from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

/**
 * Categories & tags Server Actions.
 *
 * Every action re-checks `content.edit_any` — the permission that governs the
 * taxonomy tables — and RLS enforces the same permission on each query.
 *
 * A category or tag is authored once with an English label and then attached to
 * any number of stories from the story editor.
 */

const PERMISSION = "content.edit_any";

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidateTaxonomy(): void {
  revalidatePath("/admin/taxonomies");
  revalidatePath("/admin/stories");
  revalidatePath("/stories");
}

export async function saveCategoryAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ categoryId: string }>> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveCategorySchema.safeParse({
    categoryId: optionalId(formData.get("categoryId")),
    key: formData.get("key"),
    labelEn: formData.get("labelEn"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  let categoryId: string;
  if (input.categoryId) {
    const { data, error } = await supabase
      .from("categories")
      .update({ key: input.key })
      .eq("id", input.categoryId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "category update");
    if (!data) return actionForbidden();
    categoryId = data.id;
  } else {
    const { data, error } = await supabase
      .from("categories")
      .insert({ key: input.key })
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "category create");
    categoryId = data.id;
  }

  const { error: translationError } = await supabase.from("category_translations").upsert(
    { category_id: categoryId, locale: siteConfig.defaultLocale, label: input.labelEn },
    { onConflict: "category_id,locale" },
  );
  if (translationError) return dbErrorMessage(translationError, "category label save");

  revalidateTaxonomy();
  return actionOk("Category saved.", { categoryId });
}

export async function deleteCategoryAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteCategorySchema.safeParse({ categoryId: formData.get("categoryId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", parsed.data.categoryId);
  if (error) return dbErrorMessage(error, "category delete");

  revalidateTaxonomy();
  return actionOk("Category deleted. It was removed from every item that used it.");
}

export async function saveTagAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ tagId: string }>> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveTagSchema.safeParse({
    tagId: optionalId(formData.get("tagId")),
    key: formData.get("key"),
    labelEn: formData.get("labelEn"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  let tagId: string;
  if (input.tagId) {
    const { data, error } = await supabase
      .from("tags")
      .update({ key: input.key })
      .eq("id", input.tagId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "tag update");
    if (!data) return actionForbidden();
    tagId = data.id;
  } else {
    const { data, error } = await supabase.from("tags").insert({ key: input.key }).select("id").single();
    if (error || !data) return dbErrorMessage(error ?? {}, "tag create");
    tagId = data.id;
  }

  const { error: translationError } = await supabase.from("tag_translations").upsert(
    { tag_id: tagId, locale: siteConfig.defaultLocale, label: input.labelEn },
    { onConflict: "tag_id,locale" },
  );
  if (translationError) return dbErrorMessage(translationError, "tag label save");

  revalidateTaxonomy();
  return actionOk("Tag saved.", { tagId });
}

export async function deleteTagAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission(PERMISSION);
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteTagSchema.safeParse({ tagId: formData.get("tagId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", parsed.data.tagId);
  if (error) return dbErrorMessage(error, "tag delete");

  revalidateTaxonomy();
  return actionOk("Tag deleted. It was removed from every item that used it.");
}
