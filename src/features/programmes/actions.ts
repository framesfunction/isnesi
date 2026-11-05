"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { parseBlocksField } from "@/lib/validation/blocks";
import {
  deleteProgrammeSchema,
  programmeReorderSchema,
  programmeToggleSchema,
  saveProgrammeSchema,
} from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

/**
 * Programmes Server Actions.
 *
 * Every action re-checks `programmes.manage` and RLS enforces the same
 * permission on each query. Deactivation is preferred over deletion, so the
 * public list can drop a programme without losing its translations.
 */

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidateProgrammes(): void {
  revalidatePath("/admin/programmes");
  revalidatePath("/programmes");
  revalidatePath("/");
}

export async function saveProgrammeAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ programmeId: string }>> {
  const user = await assertPermission("programmes.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveProgrammeSchema.safeParse({
    programmeId: optionalId(formData.get("programmeId")),
    key: formData.get("key"),
    icon: formData.get("icon") ?? "",
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
    titleEn: formData.get("titleEn"),
    summaryEn: formData.get("summaryEn") ?? "",
    bodyEnBlocks: parseBlocksField(formData.get("bodyEnBlocks")),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  let programmeId: string;
  if (input.programmeId) {
    const { data, error } = await supabase
      .from("programmes")
      .update({
        key: input.key,
        icon: input.icon,
        sort_order: input.sortOrder,
        is_active: input.isActive,
      })
      .eq("id", input.programmeId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "programme update");
    if (!data) return actionForbidden();
    programmeId = data.id;
  } else {
    const { data, error } = await supabase
      .from("programmes")
      .insert({
        key: input.key,
        icon: input.icon,
        sort_order: input.sortOrder,
        is_active: input.isActive,
      })
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "programme create");
    programmeId = data.id;
  }

  const { error: enError } = await supabase.from("programme_translations").upsert(
    {
      programme_id: programmeId,
      locale: "en",
      title: input.titleEn,
      summary: input.summaryEn,
      body: { blocks: input.bodyEnBlocks },
    },
    { onConflict: "programme_id,locale" },
  );
  if (enError) return dbErrorMessage(enError, "programme translation create");

  revalidateProgrammes();
  return actionOk("Programme saved.", { programmeId });
}

export async function toggleProgrammeActiveAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("programmes.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = programmeToggleSchema.safeParse({
    programmeId: formData.get("programmeId"),
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("programmes")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.programmeId);

  if (error) return dbErrorMessage(error, "programme toggle");

  revalidateProgrammes();
  return actionOk(parsed.data.isActive ? "Programme activated." : "Programme deactivated.");
}

/**
 * Swap sort_order with the neighbouring programme rather than renumbering the
 * whole list: fewer writes, and concurrent edits cannot collide.
 */
export async function reorderProgrammeAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("programmes.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = programmeReorderSchema.safeParse({
    programmeId: formData.get("programmeId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { data: programmes } = await supabase
    .from("programmes")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true });

  const ordered = programmes ?? [];
  const index = ordered.findIndex((programme) => programme.id === parsed.data.programmeId);
  const target = parsed.data.direction === "up" ? index - 1 : index + 1;

  if (index === -1 || target < 0 || target >= ordered.length) {
    return actionOk("Already at the edge.");
  }

  const moves = [
    { id: parsed.data.programmeId, next: ordered[target].sort_order },
    { id: ordered[target].id, next: ordered[index].sort_order },
  ];

  for (const move of moves) {
    const { error } = await supabase
      .from("programmes")
      .update({ sort_order: move.next })
      .eq("id", move.id);
    if (error) return dbErrorMessage(error, "programme reorder");
  }

  revalidateProgrammes();
  return actionOk("Programme order updated.");
}

export async function deleteProgrammeAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("programmes.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteProgrammeSchema.safeParse({ programmeId: formData.get("programmeId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  // A programme that is still referenced by media cannot be removed: the cascade
  // would silently sever those usage records.
  const { count, error: usageError } = await supabase
    .from("media_usage")
    .select("media_id", { count: "exact", head: true })
    .eq("entity_type", "programme")
    .eq("entity_id", parsed.data.programmeId);

  if (usageError) return dbErrorMessage(usageError, "programme usage count");
  if ((count ?? 0) > 0) {
    return actionError(
      "This programme is still referenced by media. Remove those references before deleting it.",
    );
  }

  const { error } = await supabase.from("programmes").delete().eq("id", parsed.data.programmeId);
  if (error) return dbErrorMessage(error, "programme delete");

  revalidateProgrammes();
  return actionOk("Programme deleted.");
}