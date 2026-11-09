import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import type { ContentType, Json } from "@/types/database";

import { STORY_TYPES, isStoryType } from "./helpers";

/**
 * Public reads for stories and news.
 *
 * RLS already limits every row to `status = 'published'` with a past
 * `published_at`, and gives anonymous visitors read access to categories and
 * tags. These functions only shape what is already public; each one fails closed
 * to an empty value when the database is unreachable.
 */

export type StorySummary = {
  id: string;
  slug: string;
  contentType: ContentType;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
  title: string;
  excerpt: string | null;
};

/** A category or tag as it is displayed next to a story. */
export type StoryLabel = { id: string; label: string };

export type StoryDetail = StorySummary & {
  body: Json;
  seoDescription: string | null;
  categories: StoryLabel[];
  tags: StoryLabel[];
};

type PublicClient = ReturnType<typeof createPublicClient>;

type ContentRow = {
  id: string;
  slug: string;
  content_type: string;
  featured: boolean;
  published_at: string | null;
  updated_at: string;
};

const SUMMARY_COLUMNS = "id, slug, content_type, featured, published_at, updated_at";
const DEFAULT_STORY_LIMIT = 12;

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Join titles to content rows, preferring the default locale for each item and
 * dropping rows that have no readable translation.
 */
async function attachTitles(supabase: PublicClient, rows: ContentRow[]): Promise<StorySummary[]> {
  if (rows.length === 0) return [];

  const { data: translations, error } = await supabase
    .from("content_translations")
    .select("content_id, locale, title, excerpt")
    .in(
      "content_id",
      rows.map((row) => row.id),
    );

  if (error) {
    console.warn("[isnesi] story translations unavailable", { code: error.code });
  }

  const grouped = new Map<string, { locale: string; title: string; excerpt: string | null }[]>();
  for (const row of translations ?? []) {
    const list = grouped.get(row.content_id) ?? [];
    list.push({ locale: row.locale, title: row.title, excerpt: row.excerpt });
    grouped.set(row.content_id, list);
  }

  const defaultLocale = "en";

  return rows.flatMap((row) => {
    const options = grouped.get(row.id) ?? [];
    const translation = options.find((option) => option.locale === defaultLocale) ?? options[0];
    if (!translation || !isStoryType(row.content_type)) return [];
    return [
      {
        id: row.id,
        slug: row.slug,
        contentType: row.content_type,
        featured: row.featured,
        publishedAt: row.published_at,
        updatedAt: row.updated_at,
        title: translation.title,
        excerpt: translation.excerpt,
      },
    ];
  });
}

/** Published stories and news, newest first, with optional type filter and paging. */
export async function listPublishedStories(
  options: { limit?: number; offset?: number; contentType?: ContentType } = {},
): Promise<StorySummary[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    const limit = options.limit ?? DEFAULT_STORY_LIMIT;
    const offset = options.offset ?? 0;

    let query = supabase
      .from("content_items")
      .select(SUMMARY_COLUMNS)
      .eq("status", "published")
      .lte("published_at", nowIso())
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (options.contentType) query = query.eq("content_type", options.contentType);

    const { data, error } = await query;
    if (error) {
      console.warn("[isnesi] unable to load stories", { code: error.code });
      return [];
    }

    return attachTitles(supabase, (data ?? []) as ContentRow[]);
  } catch (error) {
    console.warn("[isnesi] stories unavailable", error);
    return [];
  }
}

/** Count of published stories visible publicly, optionally for one type. */
export async function countPublishedStories(
  options: { contentType?: ContentType } = {},
): Promise<number> {
  if (!hasPublicContentAccess()) return 0;

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("content_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .lte("published_at", nowIso());

    if (options.contentType) query = query.eq("content_type", options.contentType);

    const { count, error } = await query;
    if (error) {
      console.warn("[isnesi] published story count failed", { code: error.code });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.warn("[isnesi] published story count unavailable", error);
    return 0;
  }
}

/** Published counts per content type, for the public filter bar. */
export async function countPublishedStoriesByType(): Promise<Record<ContentType, number>> {
  const entries = await Promise.all(
    STORY_TYPES.map(
      async (type) => [type, await countPublishedStories({ contentType: type })] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<ContentType, number>;
}

/** Categories and tags attached to one content item, with English labels. */
async function getStoryLabels(
  supabase: PublicClient,
  contentId: string,
): Promise<{ categories: StoryLabel[]; tags: StoryLabel[] }> {
  const { data: categoryLinks } = await supabase
    .from("content_categories")
    .select("category_id")
    .eq("content_id", contentId);

  const { data: tagLinks } = await supabase
    .from("content_tags")
    .select("tag_id")
    .eq("content_id", contentId);

  const categoryIds = (categoryLinks ?? []).map((row) => row.category_id);
  const tagIds = (tagLinks ?? []).map((row) => row.tag_id);

  let categories: StoryLabel[] = [];
  if (categoryIds.length > 0) {
    const { data } = await supabase
      .from("category_translations")
      .select("category_id, label")
      .in("category_id", categoryIds)
      .eq("locale", "en");
    categories = (data ?? []).map((row) => ({ id: row.category_id, label: row.label }));
  }

  let tags: StoryLabel[] = [];
  if (tagIds.length > 0) {
    const { data } = await supabase
      .from("tag_translations")
      .select("tag_id, label")
      .in("tag_id", tagIds)
      .eq("locale", "en");
    tags = (data ?? []).map((row) => ({ id: row.tag_id, label: row.label }));
  }

  return { categories, tags };
}

/** A single published story with its body, categories and tags. */
export async function getPublishedStoryBySlug(slug: string): Promise<StoryDetail | null> {
  if (!hasPublicContentAccess()) return null;

  try {
    const supabase = createPublicClient();

    const { data: item, error } = await supabase
      .from("content_items")
      .select(SUMMARY_COLUMNS)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", nowIso())
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] unable to load story", { slug, code: error.code });
      return null;
    }
    if (!item) return null;

    const row = item as ContentRow;
    if (!isStoryType(row.content_type)) {
      console.warn("[isnesi] story has unknown content_type", { slug: row.slug });
      return null;
    }

    const { data: translations } = await supabase
      .from("content_translations")
      .select("locale, title, excerpt, body, seo_description")
      .eq("content_id", row.id);

    const options = translations ?? [];
    const translation = options.find((option) => option.locale === "en") ?? options[0];
    if (!translation) return null;

    const { categories, tags } = await getStoryLabels(supabase, row.id);

    return {
      id: row.id,
      slug: row.slug,
      contentType: row.content_type,
      featured: row.featured,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      title: translation.title,
      excerpt: translation.excerpt,
      body: translation.body,
      seoDescription: translation.seo_description,
      categories,
      tags,
    };
  } catch (error) {
    console.warn("[isnesi] story unavailable", { slug, error });
    return null;
  }
}

/**
 * Related stories for a detail page: the other published items sharing a
 * category first, then topped up with the latest published items. The current
 * story is always excluded, and the result never repeats an item.
 */
export async function listRelatedStories(options: {
  contentId: string;
  categoryIds?: string[];
  limit?: number;
}): Promise<StorySummary[]> {
  if (!hasPublicContentAccess()) return [];

  const limit = options.limit ?? 3;

  try {
    const supabase = createPublicClient();
    const excluded = new Set<string>([options.contentId]);
    const collected: StorySummary[] = [];

    const categoryIds = options.categoryIds ?? [];
    if (categoryIds.length > 0) {
      const { data: links } = await supabase
        .from("content_categories")
        .select("content_id")
        .in("category_id", categoryIds);

      const candidateIds = [...new Set((links ?? []).map((row) => row.content_id))].filter(
        (id) => !excluded.has(id),
      );

      if (candidateIds.length > 0) {
        const { data } = await supabase
          .from("content_items")
          .select(SUMMARY_COLUMNS)
          .in("id", candidateIds)
          .eq("status", "published")
          .lte("published_at", nowIso())
          .order("published_at", { ascending: false })
          .limit(limit);

        for (const story of await attachTitles(supabase, (data ?? []) as ContentRow[])) {
          if (excluded.has(story.id)) continue;
          collected.push(story);
          excluded.add(story.id);
        }
      }
    }

    if (collected.length < limit) {
      const { data } = await supabase
        .from("content_items")
        .select(SUMMARY_COLUMNS)
        .eq("status", "published")
        .lte("published_at", nowIso())
        .order("published_at", { ascending: false })
        .limit(limit + excluded.size);

      for (const story of await attachTitles(supabase, (data ?? []) as ContentRow[])) {
        if (collected.length >= limit) break;
        if (excluded.has(story.id)) continue;
        collected.push(story);
        excluded.add(story.id);
      }
    }

    return collected.slice(0, limit);
  } catch (error) {
    console.warn("[isnesi] related stories unavailable", error);
    return [];
  }
}
