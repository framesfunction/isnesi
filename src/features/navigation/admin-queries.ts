import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads for navigation menus and their items. RLS requires
 * `pages.manage`; the public site reads only visible items.
 */

export type AdminNavigationItem = {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  href: string;
  sortOrder: number;
  isVisible: boolean;
  openNewTab: boolean;
};

export type AdminNavigationMenu = {
  id: string;
  key: string;
  label: string;
  items: AdminNavigationItem[];
};

export async function listAdminNavigation(): Promise<AdminNavigationMenu[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: menus, error } = await supabase
    .from("navigation_menus")
    .select("id, key, label")
    .order("key", { ascending: true });

  if (error) {
    console.warn("[isnesi] admin navigation unavailable", { code: error.code });
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("navigation_items")
    .select("id, menu_id, parent_id, label, href, sort_order, is_visible, open_new_tab")
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.warn("[isnesi] admin navigation items unavailable", { code: itemsError.code });
    return null;
  }

  return (menus ?? []).map((menu) => ({
    id: menu.id,
    key: menu.key,
    label: menu.label,
    items: (items ?? [])
      .filter((item) => item.menu_id === menu.id)
      .map((item) => ({
        id: item.id,
        menuId: item.menu_id,
        parentId: item.parent_id,
        label: item.label,
        href: item.href,
        sortOrder: item.sort_order,
        isVisible: item.is_visible,
        openNewTab: item.open_new_tab,
      })),
  }));
}
