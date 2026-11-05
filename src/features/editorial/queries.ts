import { siteConfig } from "@/lib/site";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import type { ContentType, Json } from "@/types/database";

export type StorySummary = {
  id: string;
  slug: string;
  contentType: ContentType;
  featured: boolean;
  publishedAt: string | null;
  title: string;
  excerpt: string | null;
};

const CONTENT_TYPES: readonly ContentType[] = ["story", "news", "announcement", "policy"];

/**
 * Validate a text column value against the known content types so raw rows
 * cannot widen the union application code relies on.
 */
function asContentType(value: string): ContentType | null {
  return CONTENT_TYPES.includes(value as ContentType) ? (value as ContentType) : null;
}

/**
 * Published stories and news for the public website.
 * RLS already limits rows to `status = 'published'` with a past `published_at`.
 */
export async function listPublishedStories(
  options: { limit?: number; contentType?: ContentType } = {},
): Promise<StorySummary[]> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("content_items")
      .select("id, slug, content_type, featured, published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(options.limit ?? 12);

    if (options.contentType) {
      query = query.eq("content_type", options.contentType);
    }

    const { data: items, error } = await query;
    if (error) {
      console.warn("[isnesi] unable to load stories", { code: error.code });
      return [];
    }
    if (!items || items.length === 0) return [];

    const { data: translations, error: translationError } = await supabase
      .from("content_translations")
      .select("content_id, locale, title, excerpt")
      .in(
        "content_id",
        items.map((item) => item.id),
      );

    if (translationError) {
      console.warn("[isnesi] unable to load story translations", { code: translationError.code });
    }

    const rows = translations ?? [];
    const defaultLocale = siteConfig.defaultLocale;

    return items.flatMap((item) => {
      const forItem = rows.filter((row) => row.content_id === item.id);
      const translation =
        forItem.find((row) => row.locale === defaultLocale) ?? forItem[0];
      const contentType = asContentType(item.content_type);
      if (!translation || !contentType) return [];
      return [
        {
          id: item.id,
          slug: item.slug,
          contentType,
          featured: item.featured,
          publishedAt: item.published_at,
          title: translation.title,
          excerpt: translation.excerpt,
        },
      ];
    });
  } catch (error) {
    console.warn("[isnesi] stories unavailable", error);
    return [];
  }
}

/** A single published story, including its structured body. */
export async function getPublishedStoryBySlug(
  slug: string,
): Promise<(StorySummary & { body: Json; seoDescription: string | null }) | null> {
  if (!hasPublicContentAccess()) return null;

  try {
    const supabase = createPublicClient();

    const { data: item, error } = await supabase
      .from("content_items")
      .select("id, slug, content_type, featured, published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] unable to load story", { slug, code: error.code });
      return null;
    }
    if (!item) return null;

    const { data: translations } = await supabase
      .from("content_translations")
      .select("locale, title, excerpt, body, seo_description")
      .eq("content_id", item.id);

    const rows = translations ?? [];
    const defaultLocale = siteConfig.defaultLocale;
    const translation =
      rows.find((row) => row.locale === defaultLocale) ?? rows[0];

    if (!translation) return null;

    const contentType = asContentType(item.content_type);
    if (!contentType) {
      console.warn("[isnesi] story has unknown content_type", { slug: item.slug });
      return null;
    }

    return {
      id: item.id,
      slug: item.slug,
      contentType,
      featured: item.featured,
      publishedAt: item.published_at,
      title: translation.title,
      excerpt: translation.excerpt,
      seoDescription: translation.seo_description,
      body: translation.body,
    };
  } catch (error) {
    console.warn("[isnesi] story unavailable", { slug, error });
    return null;
  }
}