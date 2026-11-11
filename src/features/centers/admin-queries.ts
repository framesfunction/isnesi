import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { publicObjectUrl } from "@/features/media/helpers";

/**
 * Admin reads for the Centers module. RLS enforces `centers.manage`; the public
 * read path is limited to visible centers, so the admin list is only visible
 * through an authenticated admin session.
 */

export type AdminCenterListItem = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  publicVisible: boolean;
  updatedAt: string;
  logoMediaId: string | null;
  mapMediaId: string | null;
};

export type AdminCenterMediaItem = {
  id: string;
  mediaAssetId: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
  mediaType: string;
  fileName: string | null;
  mimeType: string | null;
  publicUrl: string | null;
  width: number | null;
  height: number | null;
};

export type AdminCenterDetail = AdminCenterListItem & {
  websiteUrl: string | null;
  openingHours: string | null;
  description: string | null;
  media: AdminCenterMediaItem[];
};

type CenterRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  opening_hours: string | null;
  description: string | null;
  public_visible: boolean;
  updated_at: string;
  logo_media_id: string | null;
  map_media_id: string | null;
};

function toItem(row: CenterRow): AdminCenterListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    publicVisible: row.public_visible,
    updatedAt: row.updated_at,
    logoMediaId: row.logo_media_id,
    mapMediaId: row.map_media_id,
  };
}

export async function listAdminCenters(search: string): Promise<AdminCenterListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("centers")
    .select(
      "id, name, slug, address, city, phone, email, public_visible, updated_at, logo_media_id, map_media_id",
    )
    .order("name", { ascending: true })
    .limit(200);

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin centers unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => toItem(row as CenterRow));
}

export async function getAdminCenter(centerId: string): Promise<AdminCenterDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: center, error } = await supabase
    .from("centers")
    .select(
      "id, name, slug, address, city, phone, email, website_url, opening_hours, description, public_visible, updated_at, logo_media_id, map_media_id",
    )
    .eq("id", centerId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin center unavailable", { centerId, code: error.code });
    return null;
  }
  if (!center) return null;

  const { data: translations } = await supabase
    .from("center_translations")
    .select("locale, description")
    .eq("center_id", centerId);

  const rows = translations ?? [];

  return {
    ...toItem(center as CenterRow),
    websiteUrl: center.website_url,
    openingHours: center.opening_hours,
    description:
      rows.find((row) => row.locale === "en")?.description ?? center.description ?? null,
    media: await getAdminCenterMedia(centerId),
  };
}

export async function getAdminCenterMedia(
  centerId: string,
): Promise<AdminCenterMediaItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  const { data: media, error } = await supabase
    .from("center_media")
    .select(
      "id, media_asset_id, caption, sort_order, is_cover, media_type, created_at",
    )
    .eq("center_id", centerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[isnesi] admin center media unavailable", {
      centerId,
      code: error.code,
    });
    return [];
  }

  if (!media || media.length === 0) return [];

  const assetIds = media.map((m) => m.media_asset_id);

  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, file_name, mime_type, width, height, object_path, bucket_id")
    .in("id", assetIds);

  const assetMap = new Map(
    (assets ?? []).map((a) => [a.id, a]),
  );

  const { supabaseUrl } = getPublicEnv?.() ?? { supabaseUrl: "" };

  return media.map((item) => {
    const asset = assetMap.get(item.media_asset_id);
    return {
      id: item.id,
      mediaAssetId: item.media_asset_id,
      caption: item.caption,
      sortOrder: item.sort_order,
      isCover: item.is_cover,
      mediaType: item.media_type,
      fileName: asset?.file_name ?? null,
      mimeType: asset?.mime_type ?? null,
      publicUrl:
        asset && asset.bucket_id && asset.object_path && supabaseUrl
          ? publicObjectUrl(supabaseUrl, asset.bucket_id, asset.object_path)
          : null,
      width: asset?.width ?? null,
      height: asset?.height ?? null,
    };
  });
}
