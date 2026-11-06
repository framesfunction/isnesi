"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionForbidden, actionNotConfigured, actionOk } from "@/lib/admin/action-result";
import type { ActionResult } from "@/lib/admin/action-result";
import { dbErrorMessage } from "@/lib/admin/db-error";
import { assertPermission } from "@/lib/auth/guards";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { parseBlocksField } from "@/lib/validation/blocks";
import { contentWorkflowSchema, saveContentSchema } from "@/lib/validation/cms";
import { fieldErrors } from "@/lib/validation/form";
import type { Database } from "@/types/database";

type ContentStatus = Database["public"]["Enums"]["content_status"];

/**
 * Editorial workflow Server Actions.
 *
 * Statuses: draft -> in_review -> approved -> (scheduled|published), with
 * rejection returning the work to the author. The database snapshot trigger
 * records an immutable revision on every content_items write, so nothing here
 * needs to manage history itself.
 *
 * Permission rules (spec section 5):
 *  - Save/submit: `content.create` for your own items, `content.edit_any` for
 *    anybody's (RLS re-checks ownership on every statement).
 *  - Review: `content.review`, and never on your own work.
 *  - Publishing/unpublishing/archiving: `content.publish`.
 *  - Any material change to a non-draft item returns it to draft.
 */

const optionalId = (value: FormDataEntryValue | null): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

function revalidateStories(): void {
  revalidatePath("/admin/stories");
  revalidatePath("/stories");
  revalidatePath("/");
}

export async function saveContentAction(
  _state: unknown,
  formData: FormData,
): Promise<ActionResult<{ contentId: string }>> {
  const user = await assertPermission("content.create");
  if (!user) return actionForbidden();

  if (!isSupabaseConfigured()) return actionNotConfigured();

  const parsed = saveContentSchema.safeParse({
    contentId: optionalId(formData.get("contentId")),
    slug: formData.get("slug"),
    contentType: formData.get("contentType"),
    featured: formData.get("featured") === "on",
    scheduledAt: formData.get("scheduledAt") ?? "",
    titleEn: formData.get("titleEn"),
    excerptEn: formData.get("excerptEn") ?? "",
    seoTitleEn: formData.get("seoTitleEn") ?? "",
    seoDescriptionEn: formData.get("seoDescriptionEn") ?? "",
    bodyEnBlocks: parseBlocksField(formData.get("bodyEnBlocks")),
    taxonomyPresent: formData.get("taxonomyPresent") === "1",
    categoryIds: formData.getAll("categoryIds").map((value) => String(value)),
    tagIds: formData.getAll("tagIds").map((value) => String(value)),
  });
  if (!parsed.success) {
    return actionError("Please correct the highlighted fields.", fieldErrors(parsed.error));
  }
  const input = parsed.data;

  const supabase = await createClient();

  let currentStatus: ContentStatus | null = null;
  let currentAuthor: string | null = null;

  if (input.contentId) {
    const { data } = await supabase
      .from("content_items")
      .select("status, author_id")
      .eq("id", input.contentId)
      .maybeSingle();
    if (!data) return actionForbidden();
    currentStatus = data.status;
    currentAuthor = data.author_id;
  }

  // Anyone can start with plain `content.create`; only `content.edit_any` may
  // save work authored by somebody else.
  if (input.contentId && currentAuthor !== user.id && !user.permissions.includes("content.edit_any")) {
    return actionForbidden();
  }

  let scheduledAtIso: string | null = null;
  if (input.scheduledAt) {
    const parsedDate = new Date(input.scheduledAt);
    scheduledAtIso = Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  }

  // A material change after approval forces re-approval: a non-draft item goes
  // back to draft the moment its content is edited.
  const status: ContentStatus =
    input.contentId && currentStatus && currentStatus !== "draft" ? "draft" : (currentStatus ?? "draft");

  const itemValues = {
    content_type: input.contentType,
    slug: input.slug,
    featured: input.featured,
    scheduled_at: scheduledAtIso,
    author_id: input.contentId ? currentAuthor : user.id,
    status,
  };

  let contentId: string;
  if (input.contentId) {
    const { data: updated, error } = await supabase
      .from("content_items")
      .update(itemValues)
      .eq("id", input.contentId)
      .select("id, status")
      .maybeSingle();
    if (error) return dbErrorMessage(error, "content update");
    if (!updated) return actionForbidden();
    contentId = updated.id;
  } else {
    const { data: created, error } = await supabase
      .from("content_items")
      .insert(itemValues)
      .select("id, status")
      .single();
    if (error || !created) return dbErrorMessage(error ?? {}, "content create");
    contentId = created.id;
  }

  const { error: enError } = await supabase.from("content_translations").upsert(
    {
      content_id: contentId,
      locale: "en",
      title: input.titleEn,
      excerpt: input.excerptEn,
      seo_title: input.seoTitleEn,
      seo_description: input.seoDescriptionEn,
      body: { blocks: input.bodyEnBlocks },
    },
    { onConflict: "content_id,locale" },
  );
  if (enError) return dbErrorMessage(enError, "content translation save");

  // Categories and tags are replaced as a set, and only when the editor actually
  // submitted the taxonomy fieldset: an author without `content.edit_any` never
  // sees those controls, so their save must not silently clear the terms.
  if (input.taxonomyPresent && user.permissions.includes("content.edit_any")) {
    const { error: clearCategoriesError } = await supabase
      .from("content_categories")
      .delete()
      .eq("content_id", contentId);
    if (clearCategoriesError) return dbErrorMessage(clearCategoriesError, "content categories clear");

    if (input.categoryIds.length > 0) {
      const { error } = await supabase
        .from("content_categories")
        .insert(
          input.categoryIds.map((categoryId) => ({
            content_id: contentId,
            category_id: categoryId,
          })),
        );
      if (error) return dbErrorMessage(error, "content categories save");
    }

    const { error: clearTagsError } = await supabase
      .from("content_tags")
      .delete()
      .eq("content_id", contentId);
    if (clearTagsError) return dbErrorMessage(clearTagsError, "content tags clear");

    if (input.tagIds.length > 0) {
      const { error } = await supabase
        .from("content_tags")
        .insert(input.tagIds.map((tagId) => ({ content_id: contentId, tag_id: tagId })));
      if (error) return dbErrorMessage(error, "content tags save");
    }
  }

  revalidateStories();
  const returnedToDraft =
    input.contentId !== undefined && currentStatus !== "draft" && status === "draft";
  return actionOk(
    returnedToDraft
      ? "Changes saved. The item was returned to draft for re-approval."
      : "Content saved.",
    { contentId },
  );
}

/* ------------------------------- Workflow ---------------------------------- */

type ItemRow = { id: string; status: ContentStatus; author_id: string | null };

type ItemLoad =
  | { ok: true; item: ItemRow }
  | { ok: false; error: ReturnType<typeof actionForbidden> };

async function loadItemOrFail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contentId: string,
): Promise<ItemLoad> {
  const { data } = await supabase
    .from("content_items")
    .select("id, status, author_id")
    .eq("id", contentId)
    .maybeSingle();
  return data ? { ok: true, item: data } : { ok: false, error: actionForbidden() };
}

export async function submitForReviewAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.create");
  if (!user) return actionForbidden();

  const contentId = z.uuid().safeParse(formData.get("contentId"));
  if (!contentId.success) return actionError("Malformed request.");
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const loaded = await loadItemOrFail(supabase, contentId.data);
  if (!loaded.ok) return loaded.error;
  const { item } = loaded;
  if (item.author_id !== user.id && !user.permissions.includes("content.edit_any")) {
    return actionForbidden();
  }
  if (item.status !== "draft" && item.status !== "rejected") {
    return actionError("Only draft items or ones with requested changes can be submitted.");
  }

  const { error } = await supabase
    .from("content_items")
    .update({ status: "in_review" })
    .eq("id", contentId.data);
  if (error) return dbErrorMessage(error, "content submit");

  revalidateStories();
  return actionOk("Submitted for review.");
}

export async function reviewContentAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.review");
  if (!user) return actionForbidden();

  const input = contentWorkflowSchema.safeParse({
    contentId: formData.get("contentId"),
    action: formData.get("decision") === "approve" ? "approve" : formData.get("decision") === "reject" ? "reject" : "invalid",
    note: formData.get("note") ?? "",
  });
  if (!input.success) return actionError("Malformed request.");
  if (input.data.action !== "approve" && input.data.action !== "reject") {
    return actionError("Malformed decision.");
  }
  if (!isSupabaseConfigured()) return actionNotConfigured();
  if (input.data.action === "reject" && input.data.note === null) {
    return actionError("A rejection needs a note so the author knows what to change.", {
      note: "Say why the item is not ready.",
    });
  }

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("content_items")
    .select("id, status, author_id")
    .eq("id", input.data.contentId)
    .maybeSingle();
  if (!item) return actionForbidden();

  if (item.status !== "in_review") {
    return actionError("Only items in review can be decided on.");
  }
  // Independent approval: nobody signs off their own work.
  if (item.author_id === user.id) {
    return actionError("You cannot review your own content. Ask another reviewer.");
  }
  // The approval must tell the audit trail which snapshot was judged.
  const { data: latestRevision } = await supabase
    .from("content_revisions")
    .select("id")
    .eq("content_id", input.data.contentId)
    .order("revision_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latestRevision) return actionError("No revision snapshot exists for this item yet.");

  const decision = input.data.action === "approve" ? "approved" : "changes_requested";
  const nextStatus = input.data.action === "approve" ? "approved" : "draft";

  const { error: approvalError } = await supabase.from("content_approvals").insert({
    content_id: input.data.contentId,
    revision_id: latestRevision.id,
    reviewer_id: user.id,
    decision,
    note: input.data.note ?? null,
  });
  if (approvalError) return dbErrorMessage(approvalError, "approval record");

  const { error: transitionError } = await supabase
    .from("content_items")
    .update({ status: nextStatus, reviewer_id: user.id })
    .eq("id", input.data.contentId);
  if (transitionError) return dbErrorMessage(transitionError, "content review");

  revalidateStories();
  return actionOk(
    decision === "approved"
      ? "Approved. It can now be published by a content publisher."
      : "Changes requested. The item is back with the author.",
  );
}

export async function publishContentAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.publish");
  if (!user) return actionForbidden();

  const contentId = z.uuid().safeParse(formData.get("contentId"));
  if (!contentId.success) return actionError("Malformed request.");
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("content_items")
    .select("id, status, scheduled_at")
    .eq("id", contentId.data)
    .maybeSingle();
  if (!item) return actionForbidden();
  if (item.status !== "approved" && item.status !== "scheduled") {
    return actionError("Approved content is required before publishing.");
  }

  // A future scheduled time parks the item in `scheduled`; the publisher chooses
  // between honouring the saved schedule and publishing immediately.
  const mode = formData.get("mode") === "schedule" ? "schedule" : "publish";
  const scheduledAt = item.scheduled_at ? new Date(item.scheduled_at) : null;
  const useSchedule = mode === "schedule" && scheduledAt !== null && scheduledAt.getTime() > Date.now();

  const updates = useSchedule
    ? {
        status: "scheduled" as const,
        reviewer_id: user.id,
      }
    : {
        status: "published" as const,
        published_at: new Date().toISOString(),
        scheduled_at: null,
        reviewer_id: user.id,
      };

  const { error } = await supabase.from("content_items").update(updates).eq("id", contentId.data);
  if (error) return dbErrorMessage(error, "content publish");

  revalidateStories();
  return actionOk(
    useSchedule
      ? "Scheduled. It goes live on the publish date."
      : "Published. It is visible on the public site.",
  );
}

export async function unpublishContentAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.publish");
  if (!user) return actionForbidden();

  const contentId = z.uuid().safeParse(formData.get("contentId"));
  if (!contentId.success) return actionError("Malformed request.");
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({ status: "draft", published_at: null, reviewer_id: user.id })
    .eq("id", contentId.data);
  if (error) return dbErrorMessage(error, "content unpublish");

  revalidateStories();
  return actionOk("Unpublished. The public page is hidden again.");
}

export async function archiveContentAction(_state: unknown, formData: FormData): Promise<ActionResult> {
  const user = await assertPermission("content.publish");
  if (!user) return actionForbidden();

  const contentId = z.uuid().safeParse(formData.get("contentId"));
  if (!contentId.success) return actionError("Malformed request.");
  if (!isSupabaseConfigured()) return actionNotConfigured();

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({ status: "archived", published_at: null, reviewer_id: user.id })
    .eq("id", contentId.data);
  if (error) return dbErrorMessage(error, "content archive");

  revalidateStories();
  return actionOk("Archived. It is no longer shown publicly and stays out of the workflow.");
}
