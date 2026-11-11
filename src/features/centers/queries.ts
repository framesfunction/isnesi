import { getPublicEnv } from "@/lib/env";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import { publicObjectUrl } from "@/features/media/helpers";

export type PublicCenterMedia = {
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

export type PublicCenter = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  openingHours: string | null;
  description: string | null;
  logoUrl: string | null;
  mapUrl: string | null;
  media: PublicCenterMedia[];
};

/**
 * Publicly visible centers.
 *
 * A center is shown as soon as `public_visible = true` — there is no approval
 * workflow, so anything an administrator saves appears on the site immediately.
 */
export async function listPublicCenters(): Promise<PublicCenter[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    const { data: centers, error } = await supabase
      .from("centers")
      .select(
        "id, name, slug, address, city, phone, email, website_url, opening_hours, description, logo_media_id, map_media_id",
      )
      .eq("public_visible", true)
      .order("name", { ascending: true });

    if (error) {
      console.warn("[isnesi] unable to load centers", { code: error.code });
      return [];
    }
    if (!centers || centers.length === 0) return [];

    const centerIds = centers.map((center) => center.id);

    const { data: translations } = await supabase
      .from("center_translations")
      .select("center_id, locale, description")
      .in("center_id", centerIds);

    const logoMapIds = centers
      .map((center) => [center.logo_media_id, center.map_media_id])
      .flat()
      .filter((id): id is string => typeof id === "string");

    let media = new Map<string, string>();
    if (logoMapIds.length > 0) {
      const { data: mediaRows } = await supabase
        .from("media_assets")
        .select("id, bucket_id, object_path")
        .in("id", logoMapIds);

      const { supabaseUrl } = getPublicEnv();
      media = new Map(
        (mediaRows ?? []).map((asset) => [
          asset.id,
          publicObjectUrl(supabaseUrl, asset.bucket_id, asset.object_path),
        ]),
      );
    }

    const translationRows = translations ?? [];

    const centersWithMedia = await Promise.all(
      centers.map((center) => loadCenterMedia(supabase, center.id)),
    );

    const centerMediaMap = new Map(
      centersWithMedia.map((entry) => [entry.centerId, entry.media]),
    );

    return centers.map((center, index) => {
      const forCenter = translationRows.filter((row) => row.center_id === center.id);
      const translation =
        forCenter.find((row) => row.locale === "en") ?? forCenter[0];

      return {
        id: center.id,
        name: center.name,
        slug: center.slug,
        address: center.address,
        city: center.city,
        phone: center.phone,
        email: center.email,
        websiteUrl: center.website_url,
        openingHours: center.opening_hours,
        description: translation?.description ?? center.description ?? null,
        logoUrl: center.logo_media_id ? (media.get(center.logo_media_id) ?? null) : null,
        mapUrl: center.map_media_id ? (media.get(center.map_media_id) ?? null) : null,
        media: centerMediaMap.get(center.id) ?? [],
      };
    });
  } catch (error) {
    console.warn("[isnesi] centers unavailable", error);
    return [];
  }
}

type CenterMediaLoad = { centerId: string; media: PublicCenterMedia[] };

async function loadCenterMedia(
  supabase: ReturnType<typeof createPublicClient>,
  centerId: string,
): Promise<CenterMediaLoad> {
  const { data: media, error } = await supabase
    .from("center_media")
    .select(
      "id, media_asset_id, caption, sort_order, is_cover, media_type",
    )
    .eq("center_id", centerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !media || media.length === 0) {
    return { centerId, media: [] };
  }

  const assetIds = media.map((m) => m.media_asset_id);

  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, file_name, mime_type, width, height, object_path, bucket_id")
    .in("id", assetIds);

  const assetMap = new Map(
    (assets ?? []).map((a) => [a.id, a]),
  );

  const { supabaseUrl } = getPublicEnv();

  return {
    centerId,
    media: media.map((item) => {
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
          asset && asset.bucket_id && asset.object_path
            ? publicObjectUrl(supabaseUrl, asset.bucket_id, asset.object_path)
            : null,
        width: asset?.width ?? null,
        height: asset?.height ?? null,
      };
    }),
  };
}

/**
 * A single publicly visible center by slug, with its full media gallery.
 */
export async function getPublicCenterBySlug(
  slug: string,
): Promise<PublicCenter | null> {
  if (!hasPublicContentAccess()) return null;

  try {
    const supabase = createPublicClient();

    const { data: center, error } = await supabase
      .from("centers")
      .select(
        "id, name, slug, address, city, phone, email, website_url, opening_hours, description, logo_media_id, map_media_id",
      )
      .eq("slug", slug)
      .eq("public_visible", true)
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] unable to load center", { slug, code: error.code });
      return null;
    }
    if (!center) return null;

    const { data: translations } = await supabase
      .from("center_translations")
      .select("locale, description")
      .eq("center_id", center.id);

    const rows = translations ?? [];
    const translation =
      rows.find((row) => row.locale === "en") ?? rows[0];

    const logoMapIds = [center.logo_media_id, center.map_media_id].filter(
      (id): id is string => typeof id === "string",
    );

    let media = new Map<string, string>();
    if (logoMapIds.length > 0) {
      const { data: mediaRows } = await supabase
        .from("media_assets")
        .select("id, bucket_id, object_path")
        .in("id", logoMapIds);

      const { supabaseUrl } = getPublicEnv();
      media = new Map(
        (mediaRows ?? []).map((asset) => [
          asset.id,
          publicObjectUrl(supabaseUrl, asset.bucket_id, asset.object_path),
        ]),
      );
    }

    const { centerMediaMap } = await loadCenterMediaMap(supabase, [center.id]);

    return {
      id: center.id,
      name: center.name,
      slug: center.slug,
      address: center.address,
      city: center.city,
      phone: center.phone,
      email: center.email,
      websiteUrl: center.website_url,
      openingHours: center.opening_hours,
      description: translation?.description ?? center.description ?? null,
      logoUrl: center.logo_media_id ? (media.get(center.logo_media_id) ?? null) : null,
      mapUrl: center.map_media_id ? (media.get(center.map_media_id) ?? null) : null,
      media: centerMediaMap.get(center.id) ?? [],
    };
  } catch (error) {
    console.warn("[isnesi] center unavailable", { slug, error });
    return null;
  }
}

async function loadCenterMediaMap(
  supabase: ReturnType<typeof createPublicClient>,
  centerIds: string[],
): Promise<{ centerMediaMap: Map<string, PublicCenterMedia[]> }> {
  const { data: media, error } = await supabase
    .from("center_media")
    .select(
      "id, center_id, media_asset_id, caption, sort_order, is_cover, media_type",
    )
    .in("center_id", centerIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const centerMediaMap = new Map<string, PublicCenterMedia[]>();
  centerIds.forEach((cid) => centerMediaMap.set(cid, []));

  if (error || !media || media.length === 0) {
    return { centerMediaMap };
  }

  const assetIds = media.map((m) => m.media_asset_id);

  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, file_name, mime_type, width, height, object_path, bucket_id")
    .in("id", assetIds);

  const assetMap = new Map(
    (assets ?? []).map((a) => [a.id, a]),
  );

  const { supabaseUrl } = getPublicEnv();

  for (const item of media) {
    const asset = assetMap.get(item.media_asset_id);
    const entry: PublicCenterMedia = {
      id: item.id,
      mediaAssetId: item.media_asset_id,
      caption: item.caption,
      sortOrder: item.sort_order,
      isCover: item.is_cover,
      mediaType: item.media_type,
      fileName: asset?.file_name ?? null,
      mimeType: asset?.mime_type ?? null,
      publicUrl:
        asset && asset.bucket_id && asset.object_path
          ? publicObjectUrl(supabaseUrl, asset.bucket_id, asset.object_path)
          : null,
      width: asset?.width ?? null,
      height: asset?.height ?? null,
    };

    const existing = centerMediaMap.get(item.center_id) ?? [];
    existing.push(entry);
    centerMediaMap.set(item.center_id, existing);
  }

  return { centerMediaMap };
}
