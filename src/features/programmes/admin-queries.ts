import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads for the Programmes module.
 *
 * Visibility is decided by Row Level Security (`programmes.manage`), so these
 * functions add no authorisation of their own. They return `null` when Supabase
 * is not configured so the page can say so instead of showing an empty list.
 */

export type AdminProgrammeListItem = {
  id: string;
  key: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  title: string | null;
};

export type AdminProgrammeDetail = {
  id: string;
  key: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  featuredImageId: string | null;
  objectives: string[];
  activities: string[];
  targetBeneficiaries: string | null;
  geographicCoverage: string | null;
  title: string | null;
  summary: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  body: unknown;
};

type ProgrammeRow = {
  id: string;
  key: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

type ProgrammeDetailRow = ProgrammeRow & {
  featured_image_id: string | null;
  objectives: unknown;
  activities: unknown;
  target_beneficiaries: string | null;
  geographic_coverage: string | null;
};

type TranslationRow = {
  programme_id: string;
  locale: string;
  title: string;
  summary: string | null;
  body: unknown;
  seo_title?: string | null;
  seo_description?: string | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

const PROGRAMME_COLUMNS = "id, key, icon, sort_order, is_active, updated_at";
const PROGRAMME_DETAIL_COLUMNS =
  "id, key, icon, sort_order, is_active, updated_at, featured_image_id, objectives, activities, target_beneficiaries, geographic_coverage";
const TRANSLATION_COLUMNS = "programme_id, locale, title, summary, body";
const TRANSLATION_DETAIL_COLUMNS =
  "programme_id, locale, title, summary, body, seo_title, seo_description";

function indexTranslations(rows: TranslationRow[]): Map<string, TranslationRow> {
  const map = new Map<string, TranslationRow>();
  for (const row of rows) {
    if (row.locale === "en") {
      map.set(row.programme_id, row);
    }
  }
  return map;
}

/** Programmes with their English titles; optional key/title search. */
export async function listAdminProgrammes(search: string): Promise<AdminProgrammeListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let rows: ProgrammeRow[] = [];
  try {
    const { data, error } = await supabase
      .from("programmes")
      .select(PROGRAMME_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true })
      .limit(200);

    if (error) {
      console.warn("[isnesi] admin programmes unavailable", { code: error.code });
      return null;
    }
    rows = (data ?? []) as ProgrammeRow[];
  } catch {
    console.warn("[isnesi] admin programmes unavailable", { reason: "query failed" });
    return null;
  }

  if (rows.length === 0) return [];

  let translations: TranslationRow[] = [];
  try {
    const { data: t, error: translationError } = await supabase
      .from("programme_translations")
      .select(TRANSLATION_COLUMNS)
      .eq("locale", "en")
      .in(
        "programme_id",
        rows.map((row) => row.id),
      );

    if (translationError) {
      console.warn("[isnesi] programme translations unavailable", { code: translationError.code });
    }
    translations = (t ?? []) as TranslationRow[];
  } catch {
    console.warn("[isnesi] programme translations unavailable", { reason: "query failed" });
  }

  const byId = indexTranslations((translations ?? []) as TranslationRow[]);
  const needle = search.trim().toLowerCase();

  return rows
    .map((row) => {
      const entry = byId.get(row.id);
      return {
        id: row.id,
        key: row.key,
        icon: row.icon,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        updatedAt: row.updated_at,
        title: entry?.title ?? null,
      };
    })
    .filter((item) => {
      if (needle.length === 0) return true;
      return (
        item.key.includes(needle) ||
        (item.title ?? "").toLowerCase().includes(needle)
      );
    });
}

/** One programme with its English translation, or null when unavailable. */
export async function getAdminProgramme(programmeId: string): Promise<AdminProgrammeDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  let programme: ProgrammeDetailRow | null = null;
  try {
    const { data: p, error } = await supabase
      .from("programmes")
      .select(PROGRAMME_DETAIL_COLUMNS)
      .eq("id", programmeId)
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] admin programme unavailable", { programmeId, code: error.code });
      return null;
    }
    programme = (p ?? null) as ProgrammeDetailRow | null;
  } catch {
    console.warn("[isnesi] admin programme unavailable", { programmeId, reason: "query failed" });
    return null;
  }
  if (!programme) return null;

  let translation: TranslationRow | null = null;
  try {
    const { data: t } = await supabase
      .from("programme_translations")
      .select(TRANSLATION_DETAIL_COLUMNS)
      .eq("programme_id", programmeId)
      .eq("locale", "en")
      .maybeSingle();

    translation = (t ?? null) as TranslationRow | null;
  } catch {
    console.warn("[isnesi] programme translation unavailable", { programmeId, reason: "query failed" });
  }

  const base = programme;

  return {
    id: base.id,
    key: base.key,
    icon: base.icon,
    sortOrder: base.sort_order,
    isActive: base.is_active,
    updatedAt: base.updated_at,
    featuredImageId: base.featured_image_id,
    objectives: asStringArray(base.objectives),
    activities: asStringArray(base.activities),
    targetBeneficiaries: base.target_beneficiaries,
    geographicCoverage: base.geographic_coverage,
    title: translation?.title ?? null,
    summary: translation?.summary ?? null,
    seoTitle: translation?.seo_title ?? null,
    seoDescription: translation?.seo_description ?? null,
    body: translation?.body ?? null,
  };
}