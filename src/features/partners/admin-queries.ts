import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads for the Partners module. RLS enforces `partners.manage`; the
 * anonymous read path is limited to approved-and-visible partners, so the
 * moderation queue can only be seen through an authenticated admin session.
 */

export type AdminPartnerListItem = {
  id: string;
  name: string;
  relationshipType: string | null;
  websiteUrl: string | null;
  approvalStatus: string;
  publicVisible: boolean;
  approvedAt: string | null;
  updatedAt: string;
  logoMediaId: string | null;
};

export type AdminPartnerDetail = AdminPartnerListItem & {
  descriptions: { en: string | null; fr: string | null };
};

type PartnerRow = {
  id: string;
  name: string;
  relationship_type: string | null;
  website_url: string | null;
  approval_status: string;
  public_visible: boolean;
  approved_at: string | null;
  updated_at: string;
  logo_media_id: string | null;
};

function toItem(row: PartnerRow): AdminPartnerListItem {
  return {
    id: row.id,
    name: row.name,
    relationshipType: row.relationship_type,
    websiteUrl: row.website_url,
    approvalStatus: row.approval_status,
    publicVisible: row.public_visible,
    approvedAt: row.approved_at,
    updatedAt: row.updated_at,
    logoMediaId: row.logo_media_id,
  };
}

export async function listAdminPartners(search: string, status: string): Promise<AdminPartnerListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("partners")
    .select(
      "id, name, relationship_type, website_url, approval_status, public_visible, approved_at, updated_at, logo_media_id",
    )
    .order("name", { ascending: true })
    .limit(200);

  if (search) query = query.ilike("name", `%${search}%`);
  if (status) query = query.eq("approval_status", status);

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin partners unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => toItem(row as PartnerRow));
}

export async function getAdminPartner(partnerId: string): Promise<AdminPartnerDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: partner, error } = await supabase
    .from("partners")
    .select(
      "id, name, relationship_type, website_url, approval_status, public_visible, approved_at, updated_at, logo_media_id",
    )
    .eq("id", partnerId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin partner unavailable", { partnerId, code: error.code });
    return null;
  }
  if (!partner) return null;

  const { data: translations } = await supabase
    .from("partner_translations")
    .select("locale, description")
    .eq("partner_id", partnerId);

  const rows = translations ?? [];

  return {
    ...toItem(partner as PartnerRow),
    descriptions: {
      en: rows.find((row) => row.locale === "en")?.description ?? null,
      fr: rows.find((row) => row.locale === "fr")?.description ?? null,
    },
  };
}
