import { getPublicEnv } from "@/lib/env";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import type { Json } from "@/types/database";
import { publicObjectUrl } from "@/features/media/helpers";

export type ProgrammeSummary = {
  id: string;
  key: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  title: string;
  summary: string | null;
  featuredImageUrl: string | null;
};

type ProgrammeTranslation = {
  programme_id: string;
  locale: string;
  title: string;
  summary: string | null;
};

export type ProgrammeDetail = ProgrammeSummary & {
  body: Json;
  objectives: string[];
  activities: string[];
  targetBeneficiaries: string | null;
  geographicCoverage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImageUrl: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function pickTranslation(
  translations: ProgrammeTranslation[],
  programmeId: string,
): ProgrammeTranslation | undefined {
  const forProgramme = translations.filter((row) => row.programme_id === programmeId);
  return (
    forProgramme.find((row) => row.locale === "en") ?? forProgramme[0]
  );
}

/**
 * Programmes ordered for public display.
 *
 * `includeInactive` is used by the admin module; the public site only ever sees
 * active programmes.
 */
export async function listProgrammes(
  options: { includeInactive?: boolean } = {},
): Promise<ProgrammeSummary[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("programmes")
      .select("id, key, icon, sort_order, is_active, featured_image_id")
      .order("sort_order", { ascending: true });

    if (!options.includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: programmes, error } = await query;
    if (error) {
      console.warn("[isnesi] unable to load programmes", { code: error.code });
      return [];
    }
    if (!programmes || programmes.length === 0) return [];

    const { data: translations, error: translationError } = await supabase
      .from("programme_translations")
      .select("programme_id, locale, title, summary")
      .in(
        "programme_id",
        programmes.map((programme) => programme.id),
      );

    if (translationError) {
      console.warn("[isnesi] unable to load programme translations", {
        code: translationError.code,
      });
    }

    const rows = translations ?? [];

    // Resolve featured image URLs for programmes that reference media assets.
    const programmesWithImages = programmes.filter(
      (p): p is { featured_image_id: string } & typeof p => p.featured_image_id !== null,
    );
    const featuredImageUrls: Record<string, string> = {};
    if (programmesWithImages.length > 0) {
      const { data: mediaRows } = await supabase
        .from("media_assets")
        .select("id, bucket_id, object_path")
        .in(
          "id",
          programmesWithImages.map((p) => p.featured_image_id),
        );
      const { supabaseUrl } = getPublicEnv();
      for (const media of mediaRows ?? []) {
        featuredImageUrls[media.id] = publicObjectUrl(
          supabaseUrl,
          media.bucket_id,
          media.object_path,
        );
      }
    }

    return programmes.flatMap((programme) => {
      const translation = pickTranslation(rows, programme.id);
      if (!translation) return [];
      return [
        {
          id: programme.id,
          key: programme.key,
          icon: programme.icon,
          sortOrder: programme.sort_order,
          isActive: programme.is_active,
          title: translation.title,
          summary: translation.summary,
          featuredImageUrl:
            programme.featured_image_id !== null
              ? featuredImageUrls[programme.featured_image_id] ?? null
              : null,
        },
      ];
    });
  } catch (error) {
    console.warn("[isnesi] programmes unavailable", error);
    return [];
  }
}

/**
 * A single active programme with its default-locale translation, structured
 * fields and resolved featured image, or null when it is missing or inactive.
 *
 * RLS already limits public reads to active programmes; the explicit `is_active`
 * filter keeps the intent readable and the index usable.
 */
export async function getProgrammeByKey(key: string): Promise<ProgrammeDetail | null> {
  if (!hasPublicContentAccess()) return null;

  try {
    const supabase = createPublicClient();

    const { data: programme, error } = await supabase
      .from("programmes")
      .select(
        "id, key, icon, sort_order, is_active, objectives, activities, target_beneficiaries, geographic_coverage, featured_image_id",
      )
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] unable to load programme", { key, code: error.code });
      return null;
    }
    if (!programme) return null;

    const { data: translations } = await supabase
      .from("programme_translations")
      .select("locale, title, summary, body, seo_title, seo_description")
      .eq("programme_id", programme.id);

    const rows = translations ?? [];
    const translation =
      rows.find((row) => row.locale === "en") ?? rows[0];

    let featuredImageUrl: string | null = null;
    if (programme.featured_image_id) {
      const { data: media } = await supabase
        .from("media_assets")
        .select("bucket_id, object_path")
        .eq("id", programme.featured_image_id)
        .maybeSingle();
      if (media) {
        const { supabaseUrl } = getPublicEnv();
        featuredImageUrl = publicObjectUrl(supabaseUrl, media.bucket_id, media.object_path);
      }
    }

    return {
      id: programme.id,
      key: programme.key,
      icon: programme.icon,
      sortOrder: programme.sort_order,
      isActive: programme.is_active,
      title: translation?.title ?? programme.key,
      summary: translation?.summary ?? null,
      body: translation?.body ?? {},
      objectives: asStringArray(programme.objectives),
      activities: asStringArray(programme.activities),
      targetBeneficiaries: programme.target_beneficiaries,
      geographicCoverage: programme.geographic_coverage,
      seoTitle: translation?.seo_title ?? null,
      seoDescription: translation?.seo_description ?? null,
      featuredImageUrl,
    };
  } catch (error) {
    console.warn("[isnesi] programme unavailable", { key, error });
    return null;
  }
}