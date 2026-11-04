import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Admin reads for the editorial module.
 *
 * RLS decides what a signed-in staff member can see: authors with only
 * `content.create` see their own rows, `content.edit_any` holders see
 * everything. These functions simply run the queries; absence of
 * configuration reports a null result the route turns into an honest message.
 */

export type AdminContentListItem = {
  id: string;
  slug: string;
  contentType: string;
  status: string;
  featured: boolean;
  authorId: string | null;
  reviewerId: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
  title: string | null;
};

export type AdminContentRevision = {
  id: number;
  revisionNo: number;
  changedBy: string | null;
  createdAt: string;
};

export type AdminContentDetail = AdminContentListItem & {
  en: {
    title: string;
    excerpt: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    body: unknown;
  };
  fr: {
    title: string | null;
    excerpt: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    body: unknown;
  } | null;
  revisions: AdminContentRevision[];
  approvals: { id: string; decision: string; note: string | null; decidedAt: string; reviewerId: string }[];
};

type ContentRow = {
  id: string;
  slug: string;
  content_type: string;
  status: string;
  featured: boolean;
  author_id: string | null;
  reviewer_id: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  updated_at: string;
};

function toItem(row: ContentRow, title: string | null): AdminContentListItem {
  return {
    id: row.id,
    slug: row.slug,
    contentType: row.content_type,
    status: row.status,
    featured: row.featured,
    authorId: row.author_id,
    reviewerId: row.reviewer_id,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    updatedAt: row.updated_at,
    title,
  };
}

/** List content with optional search (by EN title) and type/status filters. */
export async function listAdminContent(
  search: string,
  type: string,
  status: string,
): Promise<AdminContentListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("content_items")
    .select(
      "id, slug, content_type, status, featured, author_id, reviewer_id, published_at, scheduled_at, updated_at, content_translations!inner(locale, title)",
    )
    .eq("content_translations.locale", "en")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.ilike("content_translations.title", `%${search}%`);
  }
  if (type) query = query.eq("content_type", type);
  if (status) query = query.eq("status", status as Database["public"]["Enums"]["content_status"]);

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin content unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) =>
    toItem(
      row as ContentRow,
      ((row as { content_translations: { title: string }[] | null }).content_translations ?? [])[0]
        ?.title ?? null,
    ),
  );
}

/** One item with translations, the latest ten revisions and the approval trail. */
export async function getAdminContent(contentId: string): Promise<AdminContentDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("content_items")
    .select(
      "id, slug, content_type, status, featured, author_id, reviewer_id, published_at, scheduled_at, updated_at",
    )
    .eq("id", contentId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin content unavailable", { contentId, code: error.code });
    return null;
  }
  if (!item) return null;

  const { data: translations } = await supabase
    .from("content_translations")
    .select("locale, title, excerpt, body, seo_title, seo_description")
    .eq("content_id", contentId);

  const rows = translations ?? [];
  const en = rows.find((row) => row.locale === "en") ?? null;
  const fr = rows.find((row) => row.locale === "fr") ?? null;

  const { data: revisions } = await supabase
    .from("content_revisions")
    .select("id, revision_no, changed_by, created_at")
    .eq("content_id", contentId)
    .order("revision_no", { ascending: false })
    .limit(10);

  const { data: approvals } = await supabase
    .from("content_approvals")
    .select("id, decision, note, decided_at, reviewer_id")
    .eq("content_id", contentId)
    .order("decided_at", { ascending: false });

  const base = item as ContentRow;

  return {
    ...toItem(base, en?.title ?? null),
    en: {
      title: en?.title ?? "",
      excerpt: en?.excerpt ?? null,
      seoTitle: en?.seo_title ?? null,
      seoDescription: en?.seo_description ?? null,
      body: en?.body ?? {},
    },
    fr: fr
      ? {
          title: fr.title,
          excerpt: fr.excerpt,
          seoTitle: fr.seo_title,
          seoDescription: fr.seo_description,
          body: fr.body,
        }
      : null,
    revisions: (revisions ?? []).map((revision) => ({
      id: revision.id,
      revisionNo: revision.revision_no,
      changedBy: revision.changed_by,
      createdAt: revision.created_at,
    })),
    approvals: (approvals ?? []).map((approval) => ({
      id: approval.id,
      decision: approval.decision,
      note: approval.note,
      decidedAt: approval.decided_at,
      reviewerId: approval.reviewer_id,
    })),
  };
}
