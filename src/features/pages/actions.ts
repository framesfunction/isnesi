"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { fieldErrors } from "@/lib/validation/form";
import { createClient } from "@/lib/supabase/server";
import {
  createPageSchema,
  deleteSectionSchema,
  pageSectionSchema,
  sectionReorderSchema,
  sectionVisibilitySchema,
  updatePageSchema,
} from "@/lib/validation/cms";
import {
  coerceSectionKey,
  dbErrorMessage,
  extractBlocks,
  parseBlocksField,
  repairNavigationLinks,
} from "@/features/pages/helpers";
import type { Json } from "@/types/database";

/**
 * Pages & sections Server Actions.
 *
 * Permission model (spec 4.3 - hiding a button is not a security control):
 *  - Structural edits require `pages.manage`; RLS enforces it a second time on
 *    every query.
 *  - Publication, unpublishing and archiving additionally require
 *    content.publish, which RLS does not express, so the split lives here.
 *  - Slug changes repair navigation linkage automatically so a rename can
 *    never strand a menu entry on a dead path; archiving hides such links.
 */

/* ------------------------------- Create page ------------------------------- */

export async function createPageAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ pageId: string }>> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = createPageSchema.safeParse({
    slug: formData.get("slug"),
    pageType: formData.get("pageType"),
    titleEn: formData.get("titleEn"),
    excerptEn: formData.get("excerptEn") ?? "",
    seoTitleEn: formData.get("seoTitleEn") ?? "",
    seoDescriptionEn: formData.get("seoDescriptionEn") ?? "",
    bodyEnBlocks: parseBlocksField(formData.get("bodyEnBlocks")),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .insert({
      slug: input.slug,
      page_type: input.pageType,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (pageError || !page) {
    return dbErrorMessage(pageError ?? {}, "page create");
  }

  const { error: translationError } = await supabase.from("page_translations").insert({
    page_id: page.id,
    locale: "en",
    title: input.titleEn,
    excerpt: input.excerptEn,
    seo_title: input.seoTitleEn,
    seo_description: input.seoDescriptionEn,
    body: { blocks: input.bodyEnBlocks },
  });

  if (translationError) {
    // Never leave a half-created page behind.
    await supabase.from("pages").delete().eq("id", page.id);
    return dbErrorMessage(translationError, "page translation create");
  }

  revalidatePath("/admin/pages");
  revalidatePath("/");
  return actionOk("Page created. Add sections, then publish when it is ready.", {
    pageId: page.id,
  });
}

/* ------------------------------- Update page ------------------------------- */

export async function updatePageAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = updatePageSchema.safeParse({
    pageId: formData.get("pageId"),
    slug: formData.get("slug"),
    pageType: formData.get("pageType"),
    showInNavigation: formData.get("showInNavigation") === "on",
    sortOrder: formData.get("sortOrder"),
    titleEn: formData.get("titleEn"),
    excerptEn: formData.get("excerptEn") ?? "",
    seoTitleEn: formData.get("seoTitleEn") ?? "",
    seoDescriptionEn: formData.get("seoDescriptionEn") ?? "",
    bodyEnBlocks: parseBlocksField(formData.get("bodyEnBlocks")),
    titleFr: formData.get("titleFr") ?? "",
    excerptFr: formData.get("excerptFr") ?? "",
    seoTitleFr: formData.get("seoTitleFr") ?? "",
    seoDescriptionFr: formData.get("seoDescriptionFr") ?? "",
    bodyFrBlocks: parseBlocksField(formData.get("bodyFrBlocks")),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("pages")
    .select("slug")
    .eq("id", input.pageId)
    .maybeSingle();
  if (!current) return actionForbidden();

  const { error: pageError } = await supabase
    .from("pages")
    .update({
      slug: input.slug,
      page_type: input.pageType,
      show_in_navigation: input.showInNavigation,
      sort_order: input.sortOrder,
      updated_by: user.id,
    })
    .eq("id", input.pageId);

  if (pageError) return dbErrorMessage(pageError, "page update");

  if (current.slug !== input.slug) {
    // Public page hrefs are root-relative (`/about`), not `/pages/...`.
    await repairNavigationLinks(supabase, current.slug, `/${input.slug}`);
    revalidatePath(`/pages/${current.slug}`);
  }

  const { error: enError } = await supabase
    .from("page_translations")
    .update({
      title: input.titleEn,
      excerpt: input.excerptEn,
      seo_title: input.seoTitleEn,
      seo_description: input.seoDescriptionEn,
      body: { blocks: input.bodyEnBlocks },
    })
    .eq("page_id", input.pageId)
    .eq("locale", "en");

  if (enError) return dbErrorMessage(enError, "page translation update");

  if (input.titleFr && input.titleFr.trim().length > 0) {
    const { error: frError } = await supabase.from("page_translations").upsert(
      {
        page_id: input.pageId,
        locale: "fr",
        title: input.titleFr,
        excerpt: input.excerptFr,
        seo_title: input.seoTitleFr,
        seo_description: input.seoDescriptionFr,
        body: { blocks: input.bodyFrBlocks ?? [] },
      },
      { onConflict: "page_id,locale" },
    );
    if (frError) return dbErrorMessage(frError, "page translation upsert");
  }

  revalidatePath(`/pages/${input.slug}`);
  revalidatePath("/");
  return actionOk("Draft saved.");
}

/* -------------------------------- Sections --------------------------------- */

export async function saveSectionAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = pageSectionSchema.safeParse({
    kind: formData.get("kind"),
    pageId: formData.get("pageId"),
    sectionId: formData.get("sectionId") || undefined,
    sectionKey: coerceSectionKey(formData.get("sectionKey")),
    heading: formData.get("heading") ?? "",
    text: formData.get("text") ?? "",
    body: parseBlocksField(formData.get("body")),
    sortOrder: formData.get("sortOrder"),
    isEnabled: formData.get("isEnabled") === "on",
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  // The parent page must exist *and* be visible to this session (RLS).
  const { data: page } = await supabase.from("pages").select("id").eq("id", input.pageId).maybeSingle();
  if (!page) return actionForbidden();

  const config: Json =
    input.kind === "text"
      ? { heading: input.heading ?? null, text: input.text ?? null }
      : { blocks: input.body };

  const values = {
    page_id: input.pageId,
    section_key: input.sectionKey,
    section_type: input.kind,
    sort_order: input.sortOrder,
    is_enabled: input.isEnabled,
    config,
  };

  const { error } =
    input.sectionId !== undefined
      ? await supabase
          .from("page_sections")
          .update(values)
          .eq("id", input.sectionId)
          .eq("page_id", input.pageId)
      : await supabase.from("page_sections").insert(values);

  if (error) {
    if (error.code === "23505") return actionError("That section key already exists on this page.");
    return dbErrorMessage(error, "section save");
  }

  revalidatePath(`/admin/pages/${input.pageId}`);
  revalidatePath("/");
  return actionOk(input.sectionId ? "Section updated." : "Section added.");
}

export async function toggleSectionVisibilityAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  const parsed = sectionVisibilitySchema.safeParse({
    pageId: formData.get("pageId"),
    sectionId: formData.get("sectionId"),
    isEnabled: formData.get("isEnabled") === "on",
  });
  if (!parsed.success) return actionError("Malformed request.");

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const { error } = await supabase
    .from("page_sections")
    .update({ is_enabled: parsed.data.isEnabled })
    .eq("id", parsed.data.sectionId)
    .eq("page_id", parsed.data.pageId);

  if (error) return dbErrorMessage(error, "section toggle");

  revalidatePath(`/admin/pages/${parsed.data.pageId}`);
  return actionOk(parsed.data.isEnabled ? "Section enabled." : "Section disabled.");
}

/**
 * Swap sort_order with the neighbouring section rather than renumbering the
 * whole list: fewer writes, and concurrent edits cannot collide.
 */
export async function reorderSectionAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  const parsed = sectionReorderSchema.safeParse({
    pageId: formData.get("pageId"),
    sectionId: formData.get("sectionId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id, sort_order")
    .eq("page_id", parsed.data.pageId)
    .order("sort_order", { ascending: true });

  const ordered = sections ?? [];
  const index = ordered.findIndex((section) => section.id === parsed.data.sectionId);
  const target = parsed.data.direction === "up" ? index - 1 : index + 1;

  if (index === -1 || target < 0 || target >= ordered.length) {
    return actionOk("Already at the edge.");
  }

  const moves = [
    { id: parsed.data.sectionId, next: ordered[target].sort_order },
    { id: ordered[target].id, next: ordered[index].sort_order },
  ];

  for (const move of moves) {
    const { error } = await supabase
      .from("page_sections")
      .update({ sort_order: move.next })
      .eq("id", move.id);
    if (error) return dbErrorMessage(error, "section reorder");
  }

  revalidatePath(`/admin/pages/${parsed.data.pageId}`);
  return actionOk("Section moved.");
}

export async function deleteSectionAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("pages.manage");
  if (!user) return actionForbidden();

  const parsed = deleteSectionSchema.safeParse({
    pageId: formData.get("pageId"),
    sectionId: formData.get("sectionId"),
  });
  if (!parsed.success) return actionError("Malformed request.");

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const { error } = await supabase
    .from("page_sections")
    .delete()
    .eq("id", parsed.data.sectionId)
    .eq("page_id", parsed.data.pageId);

  if (error) return dbErrorMessage(error, "section delete");

  revalidatePath(`/admin/pages/${parsed.data.pageId}`);
  return actionOk("Section deleted.");
}

/* --------------------------- Publication workflow --------------------------- */

export async function publishPageAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.publish");
  if (!user) return actionForbidden();

  const pageId = z.uuid().safeParse(formData.get("pageId"));
  if (!pageId.success) return actionError("Malformed request.");

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();

  // Publication safety (spec Â§6.4): a page needs a real English translation
  // with at least one renderable block before it may go live.
  const { data: translation, error } = await supabase
    .from("page_translations")
    .select("title, body")
    .eq("page_id", pageId.data)
    .eq("locale", "en")
    .maybeSingle();
  if (error) return dbErrorMessage(error, "page publish read");

  const blocks = extractBlocks(translation?.body);
  const hasContent =
    typeof translation?.title === "string" &&
    translation.title.trim().length > 0 &&
    blocks !== null &&
    blocks.length > 0;

  if (!hasContent) {
    return actionError(
      "A page needs an English title and at least one content block before it can be published.",
    );
  }

  const { error: updateError } = await supabase
    .from("pages")
    .update({ status: "published", published_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", pageId.data);

  if (updateError) return dbErrorMessage(updateError, "page publish");

  revalidatePath("/admin/pages");
  revalidatePath("/");
  return actionOk("Page published. It appears on the public site on the next refresh.");
}

export async function unpublishPageAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.publish");
  if (!user) return actionForbidden();

  const pageId = z.uuid().safeParse(formData.get("pageId"));
  if (!pageId.success) return actionError("Malformed request.");
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const { error } = await supabase
    .from("pages")
    .update({ status: "draft", updated_by: user.id })
    .eq("id", pageId.data);

  if (error) return dbErrorMessage(error, "page unpublish");

  revalidatePath("/admin/pages");
  revalidatePath("/");
  return actionOk("Page unpublished. It is hidden from the public site.");
}

export async function archivePageAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.publish");
  if (!user) return actionForbidden();

  const pageId = z.uuid().safeParse(formData.get("pageId"));
  if (!pageId.success) return actionError("Malformed request.");
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("slug, show_in_navigation")
    .eq("id", pageId.data)
    .maybeSingle();
  if (!page) return actionForbidden();

  const { error } = await supabase
    .from("pages")
    .update({ status: "archived", show_in_navigation: false, updated_by: user.id })
    .eq("id", pageId.data);

  if (error) return dbErrorMessage(error, "page archive");

  if (page.show_in_navigation) {
    await repairNavigationLinks(supabase, page.slug, null);
  }

  revalidatePath("/admin/pages");
  revalidatePath("/");
  return actionOk("Page archived. Navigation entries that pointed at it are hidden.");
}
