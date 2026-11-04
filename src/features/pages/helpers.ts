import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Internal support code for the Pages Server Actions.
 *
 * This module deliberately has no "use server" directive: only async exported
 * functions may live in a Server Action boundary, while helpers stay plain
 * imports. Nothing here talks to the network.
 */

/* ------------------------------ Field parsing ------------------------------ */

// Block parsing is shared with other CMS modules; re-exported for existing callers.
export { extractBlocks, parseBlocksField } from "@/lib/validation/blocks";

export function coerceSectionKey(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Standard database error → admin-safe message mapping now lives in one place so
// every module reports failures identically. Re-exported for existing callers.
export { dbErrorMessage } from "@/lib/admin/db-error";

/* -------------------------- Navigation link repair -------------------------- */

/**
 * Internal hrefs look like `/<slug>`. When a page slug changes we rewrite
 * matching menu items; when a page is archived we hide (not delete) them so the
 * historical menu is recoverable and no public link 404s silently.
 */
export async function repairNavigationLinks(
  supabase: SupabaseClient,
  oldSlug: string,
  newHref: string | null,
): Promise<void> {
  const oldHref = `/${oldSlug}`;
  const { data: items, error } = await supabase
    .from("navigation_items")
    .select("id")
    .eq("href", oldHref);

  if (error || !items || items.length === 0) {
    if (error) console.warn("[isnesi] navigation link lookup failed", { code: error.code });
    return;
  }

  if (newHref === null) {
    const { error: updateError } = await supabase
      .from("navigation_items")
      .update({ is_visible: false })
      .in(
        "id",
        items.map((item) => item.id),
      );
    if (updateError) {
      console.warn("[isnesi] navigation link hide failed", { code: updateError.code });
    }
    return;
  }

  const { error: updateError } = await supabase
    .from("navigation_items")
    .update({ href: newHref })
    .eq("href", oldHref);
  if (updateError) {
    console.warn("[isnesi] navigation link rewrite failed", { code: updateError.code });
  }
}
