import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads for the Programmes module.
 *
 * Visibility is decided by Row Level Security (`programmes.manage`), so these
 * functions add no authorisation of their own. They return `null` when Supabase
 * is not configured so the page can say so instead of showing an empty list.
 */

export type AdminProgrammeTranslation = {
  title: string;
  summary: string | null;
  body: unknown;
};

export type AdminProgrammeListItem = {
  id: string;
  key: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  titleEn: string | null;
  titleFr: string | null;
  hasFr: boolean;
};

export type AdminProgrammeDetail = {
  id: string;
  key: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  en: AdminProgrammeTranslation | null;
  fr: AdminProgrammeTranslation | null;
};

type ProgrammeRow = {
  id: string;
  key: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

type TranslationRow = {
  programme_id: string;
  locale: string;
  title: string;
  summary: string | null;
  body: unknown;
};

type TranslationIndex = { en?: TranslationRow; fr?: TranslationRow };

const PROGRAMME_COLUMNS = "id, key, icon, sort_order, is_active, updated_at";
const TRANSLATION_COLUMNS = "programme_id, locale, title, summary, body";

function toTranslation(row: TranslationRow): AdminProgrammeTranslation {
  return { title: row.title, summary: row.summary, body: row.body };
}

function indexTranslations(rows: TranslationRow[]): Map<string, TranslationIndex> {
  const map = new Map<string, TranslationIndex>();
  for (const row of rows) {
    const entry = map.get(row.programme_id) ?? {};
    if (row.locale === "en") entry.en = row;
    if (row.locale === "fr") entry.fr = row;
    map.set(row.programme_id, entry);
  }
  return map;
}

/** Programmes with their English and French titles; optional key/title search. */
export async function listAdminProgrammes(search: string): Promise<AdminProgrammeListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
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

  const rows = (data ?? []) as ProgrammeRow[];
  if (rows.length === 0) return [];

  const { data: translations, error: translationError } = await supabase
    .from("programme_translations")
    .select(TRANSLATION_COLUMNS)
    .in(
      "programme_id",
      rows.map((row) => row.id),
    );

  if (translationError) {
    console.warn("[isnesi] programme translations unavailable", { code: translationError.code });
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
        titleEn: entry?.en?.title ?? null,
        titleFr: entry?.fr?.title ?? null,
        hasFr: Boolean(entry?.fr),
      };
    })
    .filter((item) => {
      if (needle.length === 0) return true;
      return (
        item.key.includes(needle) ||
        (item.titleEn ?? "").toLowerCase().includes(needle) ||
        (item.titleFr ?? "").toLowerCase().includes(needle)
      );
    });
}

/** One programme with both translations, or null when unavailable. */
export async function getAdminProgramme(programmeId: string): Promise<AdminProgrammeDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: programme, error } = await supabase
    .from("programmes")
    .select(PROGRAMME_COLUMNS)
    .eq("id", programmeId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin programme unavailable", { programmeId, code: error.code });
    return null;
  }
  if (!programme) return null;

  const { data: translations } = await supabase
    .from("programme_translations")
    .select(TRANSLATION_COLUMNS)
    .eq("programme_id", programmeId);

  const rows = (translations ?? []) as TranslationRow[];
  const en = rows.find((row) => row.locale === "en") ?? null;
  const fr = rows.find((row) => row.locale === "fr") ?? null;
  const base = programme as ProgrammeRow;

  return {
    id: base.id,
    key: base.key,
    icon: base.icon,
    sortOrder: base.sort_order,
    isActive: base.is_active,
    updatedAt: base.updated_at,
    en: en ? toTranslation(en) : null,
    fr: fr ? toTranslation(fr) : null,
  };
}