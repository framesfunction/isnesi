import { siteConfig } from "@/lib/site";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import type { KidsResourceType } from "@/types/database";

export type PublicKidsResource = {
  id: string;
  resourceType: KidsResourceType;
  minAge: number | null;
  maxAge: number | null;
  featured: boolean;
  title: string;
  description: string | null;
};

const RESOURCE_TYPES: readonly KidsResourceType[] = [
  "story",
  "activity",
  "game",
  "video",
  "download",
];

/** Validate a text column value against the known Kids' Corner resource types. */
function asResourceType(value: string): KidsResourceType | null {
  return RESOURCE_TYPES.includes(value as KidsResourceType) ? (value as KidsResourceType) : null;
}

/**
 * Published Kids' Corner resources.
 *
 * The public RLS policy only exposes rows that are published AND
 * `safeguarding_approved`, so a resource can never bypass the child-safety
 * review.
 */
export async function listKidsResources(): Promise<PublicKidsResource[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    const { data: resources, error } = await supabase
      .from("kids_resources")
      .select("id, resource_type, min_age, max_age, is_featured")
      .eq("status", "published")
      .eq("safeguarding_approved", true)
      .order("is_featured", { ascending: false });

    if (error) {
      console.warn("[isnesi] unable to load kids resources", { code: error.code });
      return [];
    }
    if (!resources || resources.length === 0) return [];

    const { data: translations } = await supabase
      .from("kids_resource_translations")
      .select("resource_id, locale, title, description")
      .in(
        "resource_id",
        resources.map((resource) => resource.id),
      );

    const rows = translations ?? [];

    return resources.flatMap((resource) => {
      const forResource = rows.filter((row) => row.resource_id === resource.id);
      const translation =
        forResource.find((row) => row.locale === siteConfig.defaultLocale) ??
        forResource[0];
      const resourceType = asResourceType(resource.resource_type);
      if (!resourceType) return [];

      return [
        {
          id: resource.id,
          resourceType,
          minAge: resource.min_age,
          maxAge: resource.max_age,
          featured: resource.is_featured,
          title: translation?.title ?? "Kids' Corner resource",
          description: translation?.description ?? null,
        },
      ];
    });
  } catch (error) {
    console.warn("[isnesi] kids resources unavailable", error);
    return [];
  }
}