import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

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

export type AdminCenterDetail = AdminCenterListItem & {
  websiteUrl: string | null;
  openingHours: string | null;
  description: string | null;
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
  };
}
