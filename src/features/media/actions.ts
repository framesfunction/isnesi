"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { deleteMediaSchema, updateMediaSchema, uploadMediaSchema } from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";
import { buildObjectPath, MEDIA_PUBLIC_BUCKET, publicObjectUrl } from "@/features/media/helpers";

export type PickerMediaAsset = {
  id: string;
  fileName: string;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  publicUrl: string | null;
};

function parseCropPair(x: FormDataEntryValue | null, y: FormDataEntryValue | null): { x: number; y: number } | null {
  if (typeof x !== "string" || typeof y !== "string") return null;
  const xTrimmed = x.trim();
  const yTrimmed = y.trim();
  if (xTrimmed.length === 0 || yTrimmed.length === 0) return null;
  const xValue = Number(xTrimmed) / 100;
  const yValue = Number(yTrimmed) / 100;
  if (
    Number.isFinite(xValue) &&
    Number.isFinite(yValue) &&
    xValue >= 0 &&
    xValue <= 1 &&
    yValue >= 0 &&
    yValue <= 1
  ) {
    return { x: xValue, y: yValue };
  }
  return null;
}

/**
 * Media library Server Actions.
 *
 * Permission model: every action re-checks `media.manage` (hiding a button is
 * not a security control), and the Storage + table policies independently
 * enforce the same permission. Uploads are written to the public bucket only
 * after Zod confirms the mime type and size, so the bucket never receives a
 * file the library cannot represent.
 */

/* --------------------------------- Upload ---------------------------------- */

export async function uploadMediaAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ mediaId: string }>> {
  const user = await assertPermission("media.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = uploadMediaSchema.safeParse({
    file: formData.get("file"),
    altText: formData.get("altText") ?? "",
    caption: formData.get("caption") ?? "",
    credit: formData.get("credit") ?? "",
    rightsStatus: formData.get("rightsStatus") ?? "pending",
    rightsReference: formData.get("rightsReference") ?? "",
    consentReference: formData.get("consentReference") ?? "",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;
  const file = input.file;

  const supabase = await createClient();
  const objectPath = buildObjectPath(file.name, file.type, randomUUID());

  // Extract image dimensions so the library always knows the asset's size and
  // editors can crop or place it responsively. Non-images and unreadable files
  // simply store null dimensions.
  let width: number | null = null;
  let height: number | null = null;
  if (typeof file.type === "string" && file.type.startsWith("image/")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const metadata = await sharp(Buffer.from(arrayBuffer)).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch {
      // Dimensions unavailable; continue without them.
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_PUBLIC_BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.warn("[isnesi] media upload failed", { message: uploadError.message });
    return actionError("The file could not be uploaded. Check its type and size and try again.");
  }

  const { data: asset, error: insertError } = await supabase
    .from("media_assets")
    .insert({
      bucket_id: MEDIA_PUBLIC_BUCKET,
      object_path: objectPath,
      file_name: file.name,
      mime_type: file.type,
      byte_size: file.size,
      width,
      height,
      alt_text: input.altText,
      caption: input.caption,
      credit: input.credit,
      rights_status: input.rightsStatus,
      rights_reference: input.rightsReference,
      consent_reference: input.consentReference,
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !asset) {
    // Never leave an orphaned object behind: storage must not drift from metadata.
    await supabase.storage.from(MEDIA_PUBLIC_BUCKET).remove([objectPath]);
    return dbErrorMessage(insertError ?? {}, "media metadata create");
  }

  revalidatePath("/admin/media");
  return actionOk("Media uploaded. Confirm the rights status before it is used publicly.", {
    mediaId: asset.id,
  });
}

/* --------------------------------- Update ---------------------------------- */

export async function updateMediaAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("media.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = updateMediaSchema.safeParse({
    mediaId: formData.get("mediaId"),
    altText: formData.get("altText") ?? "",
    caption: formData.get("caption") ?? "",
    credit: formData.get("credit") ?? "",
    rightsStatus: formData.get("rightsStatus") ?? "pending",
    rightsReference: formData.get("rightsReference") ?? "",
    consentReference: formData.get("consentReference") ?? "",
    crop: parseCropPair(
      formData.get("cropX"),
      formData.get("cropY"),
    ),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();
  const updateValues = {
    alt_text: input.altText,
    caption: input.caption,
    credit: input.credit,
    rights_status: input.rightsStatus,
    rights_reference: input.rightsReference,
    consent_reference: input.consentReference,
    crop: input.crop,
  };
  const { error } = await supabase
    .from("media_assets")
    .update(updateValues as object)
    .eq("id", input.mediaId);

  if (error) return dbErrorMessage(error, "media update");

  revalidatePath("/admin/media");
  revalidatePath(`/admin/media/${input.mediaId}`);
  return actionOk("Media details saved.");
}

/* --------------------------------- Delete ---------------------------------- */

export async function deleteMediaAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("media.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteMediaSchema.safeParse({ mediaId: formData.get("mediaId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();

  // A rights-managed asset that is still referenced cannot be removed: the
  // reference would be silently severed by the cascade.
  const { count, error: usageError } = await supabase
    .from("media_usage")
    .select("media_id", { count: "exact", head: true })
    .eq("media_id", parsed.data.mediaId);

  if (usageError) return dbErrorMessage(usageError, "media usage count");
  if ((count ?? 0) > 0) {
    return actionError(
      "This asset is still used by content. Remove those references before deleting it.",
    );
  }

  const { data: asset, error: readError } = await supabase
    .from("media_assets")
    .select("bucket_id, object_path")
    .eq("id", parsed.data.mediaId)
    .maybeSingle();

  if (readError) return dbErrorMessage(readError, "media delete read");
  if (!asset) return actionForbidden();

  const { error: storageError } = await supabase.storage
    .from(asset.bucket_id)
    .remove([asset.object_path]);

  if (storageError) {
    console.warn("[isnesi] media storage delete failed", { message: storageError.message });
    return actionError("The file could not be removed from storage. Nothing was deleted.");
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", parsed.data.mediaId);
  if (error) return dbErrorMessage(error, "media delete");

  revalidatePath("/admin/media");
  return actionOk("Media deleted.");
}

/* -------------------------- Media picker for editors ------------------------- */

/**
 * List assets safe to insert into editorial content.
 *
 * Returns public-bucket images whose rights have been cleared, so an editor
 * picking an image for a page, programme or story never drops a
 * rights-pending or restricted asset onto the public site.
 */
export async function listMediaForPickerAction(): Promise<
  ActionResult<{ assets: PickerMediaAsset[] }>
> {
  const user = await assertPermission("media.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id, file_name, mime_type, byte_size, width, height, alt_text, object_path, bucket_id")
    .eq("bucket_id", MEDIA_PUBLIC_BUCKET)
    .like("mime_type", "image/%")
    .in("rights_status", ["owned", "licensed", "permission_recorded"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return dbErrorMessage(error, "media picker list");

  const supabaseUrl = getPublicEnv().supabaseUrl;
  const assets: PickerMediaAsset[] = (data ?? []).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type ?? null,
    byteSize: row.byte_size ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    altText: row.alt_text ?? null,
    publicUrl:
      row.bucket_id === MEDIA_PUBLIC_BUCKET
        ? publicObjectUrl(supabaseUrl, row.bucket_id, row.object_path)
        : null,
  }));

  return actionOk("Media ready to insert.", { assets });
}