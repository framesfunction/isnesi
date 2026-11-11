import { getPublicEnv } from "@/lib/env";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import { publicObjectUrl } from "@/features/media/helpers";

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

    const mediaIds = centers
      .map((center) => [center.logo_media_id, center.map_media_id])
      .flat()
      .filter((id): id is string => typeof id === "string");

    let media = new Map<string, string>();
    if (mediaIds.length > 0) {
      const { data: mediaRows } = await supabase
        .from("media_assets")
        .select("id, bucket_id, object_path")
        .in("id", mediaIds);

      const { supabaseUrl } = getPublicEnv();
      media = new Map(
        (mediaRows ?? []).map((asset) => [
          asset.id,
          publicObjectUrl(supabaseUrl, asset.bucket_id, asset.object_path),
        ]),
      );
    }

    const translationRows = translations ?? [];

    return centers.map((center) => {
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
      };
    });
  } catch (error) {
    console.warn("[isnesi] centers unavailable", error);
    return [];
  }
}
