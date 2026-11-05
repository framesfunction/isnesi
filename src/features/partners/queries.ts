import { getPublicEnv } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";

export type PublicPartner = {
  id: string;
  name: string;
  relationshipType: string | null;
  websiteUrl: string | null;
  description: string | null;
  logoUrl: string | null;
};

/**
 * Approved, publicly visible partners.
 *
 * A partner is only shown once `approval_status = 'approved'` and
 * `public_visible = true`, so a logo is never presented as an endorsement before
 * approval is recorded.
 */
export async function listPublicPartners(): Promise<PublicPartner[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    const { data: partners, error } = await supabase
      .from("partners")
      .select("id, name, relationship_type, website_url, logo_media_id")
      .eq("approval_status", "approved")
      .eq("public_visible", true)
      .order("name", { ascending: true });

    if (error) {
      console.warn("[isnesi] unable to load partners", { code: error.code });
      return [];
    }
    if (!partners || partners.length === 0) return [];

    const partnerIds = partners.map((partner) => partner.id);

    const { data: translations } = await supabase
      .from("partner_translations")
      .select("partner_id, locale, description")
      .in("partner_id", partnerIds);

    const logoIds = partners
      .map((partner) => partner.logo_media_id)
      .filter((id): id is string => typeof id === "string");

    let logos = new Map<string, string>();
    if (logoIds.length > 0) {
      const { data: media } = await supabase
        .from("media_assets")
        .select("id, bucket_id, object_path")
        .in("id", logoIds);

      const { supabaseUrl } = getPublicEnv();
      logos = new Map(
        (media ?? []).map((asset) => [
          asset.id,
          `${supabaseUrl}/storage/v1/object/public/${asset.bucket_id}/${asset.object_path}`,
        ]),
      );
    }

    const translationRows = translations ?? [];

    return partners.map((partner) => {
      const forPartner = translationRows.filter((row) => row.partner_id === partner.id);
      const translation =
        forPartner.find((row) => row.locale === siteConfig.defaultLocale) ??
        forPartner[0];

      return {
        id: partner.id,
        name: partner.name,
        relationshipType: partner.relationship_type,
        websiteUrl: partner.website_url,
        description: translation?.description ?? null,
        logoUrl: partner.logo_media_id ? (logos.get(partner.logo_media_id) ?? null) : null,
      };
    });
  } catch (error) {
    console.warn("[isnesi] partners unavailable", error);
    return [];
  }
}