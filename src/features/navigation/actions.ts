"use server";

import { revalidatePath } from "next/cache";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { deleteNavigationItemSchema, saveNavigationItemSchema } from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";

/**
 * Navigation Server Actions.
 *
 * RLS enforces `pages.manage`. Two rules are enforced here as well:
 *  - an item's parent must belong to the same menu, and
 *  - a parent cannot be made a child of its own descendant (no cycles).
 */

function optionalId(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function revalidateNavigation(): void {
  revalidatePath("/admin/navigation");
  revalidatePath("/");
}

export async function saveNavigationItemAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ itemId: string }>> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveNavigationItemSchema.safeParse({
    itemId: optionalId(formData.get("itemId")),
    menuId: formData.get("menuId"),
    parentItemId: formData.get("parentItemId") ?? "",
    label: formData.get("label"),
    href: formData.get("href"),
    sortOrder: formData.get("sortOrder"),
    isVisible: formData.get("isVisible") === "on",
    openNewTab: formData.get("openNewTab") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  // The menu must exist and be visible to this session (RLS).
  const { data: menu } = await supabase
    .from("navigation_menus")
    .select("id")
    .eq("id", input.menuId)
    .maybeSingle();
  if (!menu) return actionForbidden();

  // A parent must be a real item of the same menu.
  if (input.parentItemId !== null) {
    const { data: parent } = await supabase
      .from("navigation_items")
      .select("id, menu_id")
      .eq("id", input.parentItemId)
      .maybeSingle();
    if (!parent || parent.menu_id !== input.menuId) {
      return actionError("Choose a parent item from the same menu.", {
        parentItemId: "Parent must belong to the same menu.",
      });
    }
  }

  const values = {
    menu_id: input.menuId,
    parent_id: input.parentItemId,
    label: input.label,
    href: input.href,
    sort_order: input.sortOrder,
    is_visible: input.isVisible,
    open_new_tab: input.openNewTab,
  };

  let itemId: string;
  if (input.itemId) {
    // Cycle guard: an item can never become a descendant of itself.
    const { data: current } = await supabase
      .from("navigation_items")
      .select("id, parent_id")
      .eq("id", input.itemId)
      .maybeSingle();
    if (!current) return actionForbidden();

    let cursor = input.parentItemId;
    let depth = 0;
    while (cursor !== null && depth < 20) {
      if (cursor === input.itemId) {
        return actionError("A menu item cannot be nested under itself.");
      }
      const { data: ancestor } = await supabase
        .from("navigation_items")
        .select("id, parent_id")
        .eq("id", cursor)
        .maybeSingle();
      cursor = ancestor?.parent_id ?? null;
      depth += 1;
    }

    const { data, error } = await supabase
      .from("navigation_items")
      .update(values)
      .eq("id", input.itemId)
      .select("id")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "navigation item update");
    if (!data) return actionForbidden();
    itemId = data.id;
  } else {
    const { data, error } = await supabase
      .from("navigation_items")
      .insert(values)
      .select("id")
      .single();
    if (error || !data) return dbErrorMessage(error ?? {}, "navigation item create");
    itemId = data.id;
  }

  revalidateNavigation();
  return actionOk(input.itemId ? "Menu item updated." : "Menu item added.", { itemId });
}

export async function deleteNavigationItemAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = deleteNavigationItemSchema.safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) return actionError("Malformed request.");

  const supabase = await createClient();
  // Children cascade away with the parent, which is the honest outcome for a
  // submenu deleted from the tree.
  const { error } = await supabase
    .from("navigation_items")
    .delete()
    .eq("id", parsed.data.itemId);
  if (error) return dbErrorMessage(error, "navigation item delete");

  revalidateNavigation();
  return actionOk("Menu item deleted (with any nested children).");
}
