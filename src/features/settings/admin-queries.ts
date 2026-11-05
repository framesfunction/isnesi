import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminSiteSetting = {
  key: string;
  value: unknown;
  isPublic: boolean;
  updatedAt: string;
  updatedBy: string | null;
};

export async function listAdminSiteSettings(): Promise<AdminSiteSetting[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, is_public, updated_at, updated_by")
    .order("key", { ascending: true });
  if (error) {
    console.warn("[isnesi] admin settings unavailable", { code: error.code });
    return null;
  }
  return (data ?? []).map((row) => ({
    key: row.key,
    value: row.value,
    isPublic: row.is_public,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }));
}

export async function getAdminSiteSetting(key: string): Promise<AdminSiteSetting | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, is_public, updated_at, updated_by")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.warn("[isnesi] admin setting unavailable", { key, code: error.code });
    return null;
  }
  if (!data) return null;
  return {
    key: data.key,
    value: data.value,
    isPublic: data.is_public,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
}
