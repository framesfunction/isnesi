import { createPublicClient } from "@/lib/supabase/public";
import { getPublicEnv } from "@/lib/env";
import { MEDIA_PUBLIC_BUCKET, publicObjectUrl } from "@/features/media/helpers";

type PublicMedia = {
  /** Public storage URL, or null when the asset is not publicly readable. */
  url: string | null;
  width: number | null;
  height: number | null;
  /** Focal point for responsive cropping: { x, y } in [0, 1]. */
  crop: { x: number; y: number } | null;
};

/**
 * Resolve media asset ids to their public storage URLs and dimensions.
 *
 * Only assets that pass Row Level Security (`public_media_metadata`, i.e.
 * rights-status owned/licensed/permission_recorded in the public bucket) are
 * returned, so the public site never renders a rights-pending or restricted
 * image even if an editor referenced one.
 */
export async function getMediaPublicUrls(
  mediaIds: string[],
): Promise<Record<string, PublicMedia | null>> {
  if (mediaIds.length === 0) return {};

  const supabase = createPublicClient();
  type MediaAssetRow = {
  id: string;
  bucket_id: string;
  object_path: string;
  width: number | null;
  height: number | null;
  crop: unknown;
};

type MediaAssetSelect = {
  select: (
    columns: string,
  ) => {
    in: (
      column: string,
      values: string[],
    ) => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{ data: MediaAssetRow[] | null; error: { code?: string } | null }>;
    };
  };
};

const { data, error } = await (supabase
  .from("media_assets") as unknown as MediaAssetSelect)
  .select("id, bucket_id, object_path, width, height, crop")
  .in("id", mediaIds)
  .eq("bucket_id", MEDIA_PUBLIC_BUCKET);

  if (error) {
    console.warn("[isnesi] media public urls unavailable", { code: error.code });
    return {};
  }

  const { supabaseUrl } = getPublicEnv();
  const urls: Record<string, PublicMedia | null> = {};
  const rows = (data ?? []) as Array<{
    id: string;
    bucket_id: string;
    object_path: string;
    width: number | null;
    height: number | null;
    crop: unknown;
  }>;
  for (const row of rows) {
    urls[row.id] = {
      url: publicObjectUrl(supabaseUrl, row.bucket_id, row.object_path),
      width: row.width ?? null,
      height: row.height ?? null,
      crop:
        row.crop && typeof row.crop === "object" && !Array.isArray(row.crop) &&
        typeof (row.crop as { x?: unknown }).x === "number" &&
        typeof (row.crop as { y?: unknown }).y === "number"
          ? { x: (row.crop as { x: number; y: number }).x, y: (row.crop as { x: number; y: number }).y }
          : null,
    };
  }
  return urls;
}
