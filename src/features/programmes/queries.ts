import { siteConfig } from "@/lib/site";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";

export type ProgrammeSummary = {
  id: string;
  key: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  title: string;
  summary: string | null;
};

type ProgrammeTranslation = {
  programme_id: string;
  locale: string;
  title: string;
  summary: string | null;
};

function pickTranslation(
  translations: ProgrammeTranslation[],
  programmeId: string,
): ProgrammeTranslation | undefined {
  const forProgramme = translations.filter((row) => row.programme_id === programmeId);
  return (
    forProgramme.find((row) => row.locale === siteConfig.defaultLocale) ?? forProgramme[0]
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
      .select("id, key, icon, sort_order, is_active")
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
        },
      ];
    });
  } catch (error) {
    console.warn("[isnesi] programmes unavailable", error);
    return [];
  }
}