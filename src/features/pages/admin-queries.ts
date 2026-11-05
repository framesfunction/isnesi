import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Admin reads for the Pages module.
 *
 * Visibility is decided by Row Level Security, not by these functions: a staff
 * member holding `pages.manage` sees every page, and anyone else sees nothing
 * (the module guard keeps unauthorised staff out in the first place).
 */

export type AdminPageListItem = {
  id: string;
  slug: string;
  pageType: string;
  status: string;
  showInNavigation: boolean;
  sortOrder: number;
  publishedAt: string | null;
  updatedAt: string;
  title: string | null;
};

export type AdminPageSection = {
  id: string;
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  isEnabled: boolean;
  config: unknown;
};

export type AdminPageDetail = AdminPageListItem & {
  title: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  body: unknown;
  sections: AdminPageSection[];
};

type PageRow = {
  id: string;
  slug: string;
  page_type: string;
  status: string;
  show_in_navigation: boolean;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
};

function toItem(row: PageRow, title: string | null): AdminPageListItem {
  return {
    id: row.id,
    slug: row.slug,
    pageType: row.page_type,
    status: row.status,
    showInNavigation: row.show_in_navigation,
    sortOrder: row.sort_order,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    title,
  };
}

/** All pages the actor may see, joined with the default-locale title. */
export async function listAdminPages(search: string): Promise<AdminPageListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("pages")
    .select(
      "id, slug, page_type, status, show_in_navigation, sort_order, published_at, updated_at, page_translations!inner(locale, title)",
    )
    .eq("page_translations.locale", "en")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.ilike("page_translations.title", `%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin pages unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) =>
    // The inner join resolves `page_translations` as an array even for one row.
    toItem(
      row,
      (row.page_translations as unknown as { title: string }[] | null)?.[0]?.title ?? null,
    ),
  );
}

/** One page with both translation rows and its ordered sections, or null. */
export async function getAdminPage(pageId: string): Promise<AdminPageDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("pages")
    .select(
      "id, slug, page_type, status, show_in_navigation, sort_order, published_at, updated_at",
    )
    .eq("id", pageId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin page unavailable", { pageId, code: error.code });
    return null;
  }
  // Not found *or* hidden by RLS — both are a plain absence here.
  if (!page) return null;

  const { data: translations } = await supabase
    .from("page_translations")
    .select("locale, title, excerpt, seo_title, seo_description, body")
    .eq("page_id", pageId);

  const rows = translations ?? [];
  const translation = rows.find((row) => row.locale === "en") ?? null;

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id, section_key, section_type, sort_order, is_enabled, config")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  const base = page as PageRow;

  return {
    id: base.id,
    slug: base.slug,
    pageType: base.page_type,
    status: base.status,
    showInNavigation: base.show_in_navigation,
    sortOrder: base.sort_order,
    publishedAt: base.published_at,
    updatedAt: base.updated_at,
    title: translation?.title ?? "",
    excerpt: translation?.excerpt ?? null,
    seoTitle: translation?.seo_title ?? null,
    seoDescription: translation?.seo_description ?? null,
    body: translation?.body ?? {},
    sections: (sections ?? []).map((section) => ({
      id: section.id,
      sectionKey: section.section_key,
      sectionType: section.section_type,
      sortOrder: section.sort_order,
      isEnabled: section.is_enabled,
      config: section.config,
    })),
  };
}
