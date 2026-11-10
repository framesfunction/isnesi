import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminKidsResourceListItem = {
  id: string;
  resourceType: string;
  status: string;
  safeguardingApproved: boolean;
  featured: boolean;
  minAge: number | null;
  maxAge: number | null;
  title: string | null;
  updatedAt: string;
};

export type AdminKidsResourceDetail = AdminKidsResourceListItem & {
  description: string | null;
  content: unknown;
  createdBy: string | null;
};

type KidsResourceRow = {
  id: string;
  resource_type: string;
  status: string;
  safeguarding_approved: boolean;
  is_featured: boolean;
  min_age: number | null;
  max_age: number | null;
  created_by: string | null;
  updated_at: string;
};

function toItem(
  row: KidsResourceRow,
  translations: Array<{ locale: string; title: string | null; description: string | null }>,
): AdminKidsResourceListItem {
  const translation = translations.find((t) => t.locale === "en");
  return {
    id: row.id,
    resourceType: row.resource_type,
    status: row.status,
    safeguardingApproved: row.safeguarding_approved,
    featured: row.is_featured,
    minAge: row.min_age,
    maxAge: row.max_age,
    title: translation?.title ?? null,
    updatedAt: row.updated_at,
  };
}

export async function listAdminKidsResources(): Promise<AdminKidsResourceListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let resources: KidsResourceRow[] = [];
  try {
    const { data, error } = await supabase
      .from("kids_resources")
      .select("id, resource_type, status, safeguarding_approved, is_featured, min_age, max_age, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("[isnesi] admin kids resources unavailable", { code: error.code });
      return null;
    }
    resources = (data ?? []) as KidsResourceRow[];
  } catch {
    console.warn("[isnesi] admin kids resources unavailable", { reason: "query failed" });
    return null;
  }

  const ids = resources.map((r) => r.id);
  if (ids.length === 0) return [];

  let translations: Array<{ resource_id: string; locale: string; title: string | null; description: string | null }> = [];
  try {
    const { data: t } = await supabase
      .from("kids_resource_translations")
      .select("resource_id, locale, title, description")
      .in("resource_id", ids);

    translations = (t ?? []) as Array<{ resource_id: string; locale: string; title: string | null; description: string | null }>;
  } catch {
    console.warn("[isnesi] kids resource translations unavailable", { reason: "query failed" });
  }

  return resources.map((row) => toItem(row as KidsResourceRow, translations.filter((t) => t.resource_id === row.id)));
}

export async function getAdminKidsResource(resourceId: string): Promise<AdminKidsResourceDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  let resource: KidsResourceRow | null = null;
  try {
    const { data: r, error } = await supabase
      .from("kids_resources")
      .select("id, resource_type, status, safeguarding_approved, is_featured, min_age, max_age, created_by, updated_at")
      .eq("id", resourceId)
      .maybeSingle();

    if (error) {
      console.warn("[isnesi] admin kids resource unavailable", { resourceId, code: error.code });
      return null;
    }
    resource = (r ?? null) as KidsResourceRow | null;
  } catch {
    console.warn("[isnesi] admin kids resource unavailable", { resourceId, reason: "query failed" });
    return null;
  }
  if (!resource) return null;

  let rows: Array<{ locale: string; title: string | null; description: string | null; content: unknown }> = [];
  try {
    const { data: t } = await supabase
      .from("kids_resource_translations")
      .select("locale, title, description, content")
      .eq("resource_id", resourceId);

    rows = (t ?? []) as Array<{ locale: string; title: string | null; description: string | null; content: unknown }>;
  } catch {
    console.warn("[isnesi] kids resource translation unavailable", { resourceId, reason: "query failed" });
  }

  const translation = rows.find((t) => t.locale === "en");

  return {
    ...toItem(resource as KidsResourceRow, rows),
    description: translation?.description ?? null,
    content: translation?.content ?? null,
    createdBy: resource.created_by,
  };
}
