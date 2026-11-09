import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads for the Categories & tags module.
 *
 * RLS decides what a signed-in staff member may see (`content.edit_any` governs
 * these tables), so these functions add no authorisation of their own. They
 * return `null` when Supabase is not configured so the page can say so instead
 * of showing an empty list.
 */

export type AdminTaxonomyItem = {
  id: string;
  key: string;
  label: string | null;
  usageCount: number;
};

/** A category or tag as offered in a checkbox list. */
export type TaxonomyOption = { id: string; label: string };

type TaxonomyRow = { id: string; key: string };

function matches(item: AdminTaxonomyItem, needle: string): boolean {
  if (needle.length === 0) return true;
  return item.key.includes(needle) || (item.label ?? "").toLowerCase().includes(needle);
}

/** Categories with their English label and how many items use each. */
export async function listAdminCategories(search: string): Promise<AdminTaxonomyItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, key")
    .order("key", { ascending: true })
    .limit(300);

  if (error) {
    console.warn("[isnesi] admin categories unavailable", { code: error.code });
    return null;
  }

  const rows = (data ?? []) as TaxonomyRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [translations, links] = await Promise.all([
    supabase
      .from("category_translations")
      .select("category_id, label")
      .eq("locale", "en")
      .in("category_id", ids),
    supabase.from("content_categories").select("category_id").in("category_id", ids),
  ]);

  const labels = new Map(
    (translations.data ?? []).map((row) => [row.category_id, row.label] as const),
  );
  const usage = new Map<string, number>();
  for (const row of links.data ?? []) {
    usage.set(row.category_id, (usage.get(row.category_id) ?? 0) + 1);
  }

  const needle = search.trim().toLowerCase();
  return rows
    .map((row) => ({
      id: row.id,
      key: row.key,
      label: labels.get(row.id) ?? null,
      usageCount: usage.get(row.id) ?? 0,
    }))
    .filter((item) => matches(item, needle));
}

/** Tags with their English label and how many items use each. */
export async function listAdminTags(search: string): Promise<AdminTaxonomyItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, key")
    .order("key", { ascending: true })
    .limit(300);

  if (error) {
    console.warn("[isnesi] admin tags unavailable", { code: error.code });
    return null;
  }

  const rows = (data ?? []) as TaxonomyRow[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [translations, links] = await Promise.all([
    supabase
      .from("tag_translations")
      .select("tag_id, label")
      .eq("locale", "en")
      .in("tag_id", ids),
    supabase.from("content_tags").select("tag_id").in("tag_id", ids),
  ]);

  const labels = new Map((translations.data ?? []).map((row) => [row.tag_id, row.label] as const));
  const usage = new Map<string, number>();
  for (const row of links.data ?? []) {
    usage.set(row.tag_id, (usage.get(row.tag_id) ?? 0) + 1);
  }

  const needle = search.trim().toLowerCase();
  return rows
    .map((row) => ({
      id: row.id,
      key: row.key,
      label: labels.get(row.id) ?? null,
      usageCount: usage.get(row.id) ?? 0,
    }))
    .filter((item) => matches(item, needle));
}

async function getCategory(
  categoryId: string,
): Promise<{ id: string; key: string; label: string | null } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, key")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !data) return null;

  const { data: translation } = await supabase
    .from("category_translations")
    .select("label")
    .eq("category_id", categoryId)
    .eq("locale", "en")
    .maybeSingle();

  return { id: data.id, key: data.key, label: translation?.label ?? null };
}

async function getTag(
  tagId: string,
): Promise<{ id: string; key: string; label: string | null } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("id, key").eq("id", tagId).maybeSingle();

  if (error || !data) return null;

  const { data: translation } = await supabase
    .from("tag_translations")
    .select("label")
    .eq("tag_id", tagId)
    .eq("locale", "en")
    .maybeSingle();

  return { id: data.id, key: data.key, label: translation?.label ?? null };
}

export const getAdminCategory = getCategory;
export const getAdminTag = getTag;

/**
 * All categories and tags as checkbox options for the story editor. Reuses the
 * admin list functions so the label rules stay in one place.
 */
export async function listTaxonomyOptions(): Promise<{
  categories: TaxonomyOption[];
  tags: TaxonomyOption[];
}> {
  const [categories, tags] = await Promise.all([listAdminCategories(""), listAdminTags("")]);

  return {
    categories: (categories ?? []).map((item) => ({ id: item.id, label: item.label ?? item.key })),
    tags: (tags ?? []).map((item) => ({ id: item.id, label: item.label ?? item.key })),
  };
}
