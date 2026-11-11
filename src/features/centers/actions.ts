"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { saveCenterSchema } from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

const centerMediaAddSchema = z.object({
  centerId: z.string().uuid(),
  mediaAssetId: z.string().uuid(),
  caption: z.string().trim().optional().transform((v) => (v ?? "").length === 0 ? null : v),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
  mediaType: z.enum(["image", "video"]),
});

const centerMediaRemoveSchema = z.object({
  centerId: z.string().uuid(),
  mediaAssetId: z.string().uuid(),
});

const centerMediaReorderSchema = z.object({
  centerId: z.string().uuid(),
  itemId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

const centerMediaCoverSchema = z.object({
  centerId: z.string().uuid(),
  itemId: z.string().uuid(),
});

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "center";
}

function revalidateCenters(): void {
  revalidatePath("/admin/centers");
  revalidatePath("/centers");
  revalidatePath("/");
}

export async function saveCenterAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ centerId: string }>> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveCenterSchema.safeParse({
    centerId: optionalId(formData.get("centerId")),
    slug: formData.get("slug"),
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    websiteUrl: formData.get("websiteUrl"),
    openingHours: formData.get("openingHours"),
    descriptionEn: formData.get("description"),
    logoMediaId: formData.get("logoMediaId"),
    mapMediaId: formData.get("mapMediaId"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const slug = input.slug ?? slugify(input.name);

  const supabase = await createClient();

  const itemValues = {
    name: input.name,
    slug,
    address: input.address,
    city: input.city,
    phone: input.phone,
    email: input.email,
    website_url: input.websiteUrl,
    opening_hours: input.openingHours,
    description: input.descriptionEn,
    logo_media_id: input.logoMediaId,
    map_media_id: input.mapMediaId,
  };

  let centerId: string;
  if (input.centerId) {
    const { data, error } = await supabase
      .from("centers")
      .update(itemValues)
      .eq("id", input.centerId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "center update");
    if (!data) return actionForbidden();
    centerId = data.id;
  } else {
    const { data, error } = await supabase
      .from("centers")
      .insert(itemValues)
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "center create");
    centerId = data.id;
  }

  const { error } = await supabase.from("center_translations").upsert(
    {
      center_id: centerId,
      locale: "en",
      description: input.descriptionEn,
    },
    { onConflict: "center_id,locale" },
  );
  if (error) return dbErrorMessage(error, "center translation save");

  revalidateCenters();
  return actionOk("Center saved.", { centerId });
}

export async function deleteCenterAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const centerId = z.uuid().safeParse(formData.get("centerId"));
  if (!centerId.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase.from("centers").delete().eq("id", centerId.data);
  if (error) {
    if (error.code === "23503") {
      return actionError("This center still has references and cannot be deleted.");
    }
    return dbErrorMessage(error, "center delete");
  }

  revalidateCenters();
  return actionOk("Center deleted.");
}

/* --------------------------- Center media gallery -------------------------- */

export async function addCenterMediaAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = centerMediaAddSchema.safeParse({
    centerId: formData.get("centerId"),
    mediaAssetId: formData.get("mediaAssetId"),
    caption: formData.get("caption"),
    sortOrder: formData.get("sortOrder"),
    isCover: formData.get("isCover") === "on" || formData.get("isCover") === "true",
    mediaType: formData.get("mediaType"),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  // When setting a new cover, clear any existing cover on this center.
  if (input.isCover) {
    await supabase
      .from("center_media")
      .update({ is_cover: false })
      .eq("center_id", input.centerId);
  }

  const { error } = await supabase.from("center_media").insert({
    center_id: input.centerId,
    media_asset_id: input.mediaAssetId,
    caption: input.caption,
    sort_order: input.sortOrder,
    is_cover: input.isCover,
    media_type: input.mediaType,
  });
  if (error) return dbErrorMessage(error, "center media add");

  revalidateCenters();
  return actionOk("Media added to center.");
}

export async function removeCenterMediaAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = centerMediaRemoveSchema.safeParse({
    centerId: formData.get("centerId"),
    mediaAssetId: formData.get("mediaAssetId"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("center_media")
    .delete()
    .eq("center_id", parsed.data.centerId)
    .eq("media_asset_id", parsed.data.mediaAssetId);
  if (error) return dbErrorMessage(error, "center media remove");

  revalidateCenters();
  return actionOk("Media removed from center.");
}

export async function reorderCenterMediaAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = centerMediaReorderSchema.safeParse({
    centerId: formData.get("centerId"),
    itemId: formData.get("itemId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  // Load the item and its neighbor to swap sort orders.
  const { data: item } = await supabase
    .from("center_media")
    .select("id, center_id, media_asset_id, sort_order")
    .eq("id", parsed.data.itemId)
    .eq("center_id", parsed.data.centerId)
    .maybeSingle();
  if (!item) return actionError("Media item not found.");

  const { data: neighbor } = await supabase
    .from("center_media")
    .select("id, center_id, media_asset_id, sort_order")
    .eq("center_id", parsed.data.centerId)
    .eq(
      "sort_order",
      parsed.data.direction === "up" ? item.sort_order - 1 : item.sort_order + 1,
    )
    .maybeSingle();
  if (!neighbor) return actionOk("Already at the edge.");

  const { error } = await supabase
    .from("center_media")
    .upsert([
      {
        id: item.id,
        center_id: item.center_id,
        media_asset_id: item.media_asset_id,
        sort_order: neighbor.sort_order,
      },
      {
        id: neighbor.id,
        center_id: neighbor.center_id,
        media_asset_id: neighbor.media_asset_id,
        sort_order: item.sort_order,
      },
    ]);
  if (error) return dbErrorMessage(error, "center media reorder");

  revalidateCenters();
  return actionOk("Media order updated.");
}

export async function setCenterCoverAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("centers.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = centerMediaCoverSchema.safeParse({
    centerId: formData.get("centerId"),
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("center_media")
    .update({ is_cover: false })
    .eq("center_id", parsed.data.centerId);
  if (error) return dbErrorMessage(error, "center cover clear");

  const { error: setError } = await supabase
    .from("center_media")
    .update({ is_cover: true })
    .eq("id", parsed.data.itemId);
  if (setError) return dbErrorMessage(setError, "center cover set");

  revalidateCenters();
  return actionOk("Cover image updated.");
}
