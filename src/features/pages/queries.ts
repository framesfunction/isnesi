import { siteConfig } from "@/lib/site";
import { createPublicClient, hasPublicContentAccess } from "@/lib/supabase/public";
import type { Json } from "@/types/database";

export type PublicPageSection = {
  id: string;
  key: string;
  type: string;
  sortOrder: number;
  config: Json;
};

export type PublicPageContent = {
  id: string;
  slug: string;
  pageType: string;
  locale: string;
  title: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sections: PublicPageSection[];
};

/**
 * Load a published page with its ordered, enabled sections.
 *
 * Section `config` is structured data validated against the section type; it is
 * never raw HTML, so rendering it cannot introduce script injection.
 */
export async function getPublicPage(
  slug: string,
  locale: string = siteConfig.defaultLocale,
): Promise<PublicPageContent | null> {
  if (!hasPublicContentAccess()) return null;

  try {
    const supabase = createPublicClient();

    const { data: page, error } = await supabase
      .from("pages")
      .select("id, slug, page_type, status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] unable to load page", { slug, code: error.code });
      return null;
    }
    if (!page) return null;

    const { data: translations } = await supabase
      .from("page_translations")
      .select("locale, title, excerpt, seo_title, seo_description")
      .eq("page_id", page.id);

    const rows = translations ?? [];
    const translation =
      rows.find((row) => row.locale === locale) ??
      rows.find((row) => row.locale === siteConfig.defaultLocale) ??
      rows[0];

    const { data: sections } = await supabase
      .from("page_sections")
      .select("id, section_key, section_type, sort_order, config")
      .eq("page_id", page.id)
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true });

    return {
      id: page.id,
      slug: page.slug,
      pageType: page.page_type,
      locale: translation?.locale ?? locale,
      title: translation?.title ?? page.slug,
      excerpt: translation?.excerpt ?? null,
      seoTitle: translation?.seo_title ?? null,
      seoDescription: translation?.seo_description ?? null,
      sections: (sections ?? []).map((section) => ({
        id: section.id,
        key: section.section_key,
        type: section.section_type,
        sortOrder: section.sort_order,
        config: section.config,
      })),
    };
  } catch (error) {
    console.warn("[isnesi] page unavailable", { slug, error });
    return null;
  }
}

/** Slugs of published, navigation-visible pages, in display order. */
export async function listPublishedPageLinks(): Promise<
  { slug: string; sortOrder: number }[]
> {
  if (!hasPublicContentAccess()) return [];

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("pages")
      .select("slug, sort_order")
      .eq("status", "published")
      .eq("show_in_navigation", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[isnesi] unable to load page links", { code: error.code });
      return [];
    }

    return (data ?? []).map((page) => ({ slug: page.slug, sortOrder: page.sort_order }));
  } catch (error) {
    console.warn("[isnesi] page links unavailable", error);
    return [];
  }
}