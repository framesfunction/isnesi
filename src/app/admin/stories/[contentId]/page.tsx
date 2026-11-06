import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  StatusBadge,
  CONTENT_STATUS_LABELS,
} from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_TYPES } from "@/lib/validation/cms";
import { requirePermission } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import { getAdminContent } from "@/features/editorial/admin-queries";
import { listTaxonomyOptions } from "@/features/taxonomy/admin-queries";
import {
  archiveContentAction,
  deleteContentAction,
  publishContentAction,
  reviewContentAction,
  saveContentAction,
  submitForReviewAction,
  unpublishContentAction,
} from "@/features/editorial/actions";
import { extractBlocks } from "@/lib/validation/blocks";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Edit content" };

export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
const TEXTAREA_CLASS =
  "rounded-xl border border-line bg-white px-3 py-2 font-mono text-xs text-ink";

function blocksJson(body: unknown): string {
  const blocks = extractBlocks(body);
  return JSON.stringify(blocks ?? [], null, 2);
}

/** True when the item carries a schedule date that is still ahead of us. */
function scheduledInFuture(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

export default async function AdminContentEditorPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { allowed } = await requirePermission(
    "content.create",
    "/admin/stories",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the content.create permission."
      />
    );
  }

  const { contentId } = await params;
  const item = await getAdminContent(contentId);
  if (!item) notFound();

  const taxonomyOptions = await listTaxonomyOptions();

  const user = await getCurrentUser();
  const isAuthor = item.authorId === user?.id;
  const mayEdit = isAuthor || can(user, "content.edit_any");
  const canEditTaxonomy = can(user, "content.edit_any");
  const canReview = can(user, "content.review");
  const canPublish = can(user, "content.publish");
  const isSelfReview = item.authorId === user?.id;

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow="Website / Stories"
        title={item.title ?? item.slug}
        description={`/stories/${item.slug} - ${item.contentType}`}
        actions={<StatusBadge status={item.status} />}
      />

      <p className="mb-6 text-xs text-ink-muted">
        <Link
          href="/admin/stories"
          className="font-bold text-brand hover:underline"
        >
          Back to stories & news
        </Link>
        {" - "}Updated {formatDateTime(item.updatedAt)}
        {item.publishedAt
          ? ` - Published ${formatDateTime(item.publishedAt)}`
          : ""}
        {item.scheduledAt
          ? ` - Scheduled for ${formatDateTime(item.scheduledAt)}`
          : ""}
      </p>

      <div className="space-y-8">
        <Card className="border border-brand/30">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Editorial workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {(item.status === "draft" || item.status === "rejected") &&
              mayEdit ? (
                <ActionButton
                  action={submitForReviewAction}
                  hidden={{ contentId: item.id }}
                  label="Submit for review"
                  variant="default"
                />
              ) : null}

              {item.status === "in_review" && canReview ? (
                isSelfReview ? (
                  <p className="text-xs text-ink-muted">
                    You submitted this item, so another reviewer must decide on
                    it.
                  </p>
                ) : null
              ) : null}

              {item.status === "approved" && canPublish ? (
                <ActionButton
                  action={publishContentAction}
                  hidden={{ contentId: item.id, mode: "schedule" }}
                  label={
                    scheduledInFuture(item.scheduledAt) ? "Schedule" : "Publish"
                  }
                  variant="default"
                />
              ) : null}

              {item.status === "published" && canPublish ? (
                <ActionButton
                  action={unpublishContentAction}
                  hidden={{ contentId: item.id }}
                  label="Unpublish"
                />
              ) : null}

              {canPublish && item.status !== "archived" ? (
                <ActionButton
                  action={archiveContentAction}
                  hidden={{ contentId: item.id }}
                  label="Archive"
                  variant="danger"
                  confirm="Archive this item?"
                />
              ) : null}
            </div>

            {item.status === "in_review" && !canReview && !isSelfReview ? (
              <p className="text-xs text-ink-muted">Waiting on a reviewer.</p>
            ) : null}
            {item.status === "published" ? (
              <p className="mt-2 text-xs text-ink-muted">
                Live on the public site. Editing returns the item to draft for
                re-approval.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mt-6 border border-coral/40">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Delete content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              Deleting is permanent. Published items must be unpublished or
              archived first.
            </p>
            <div className="mt-3">
              <ActionButton
                action={deleteContentAction}
                hidden={{ contentId: item.id }}
                label="Delete content"
                variant="danger"
                confirm={`Delete "${item.title ?? item.slug}" permanently? This cannot be undone.`}
              />
            </div>
          </CardContent>
        </Card>

        {item.status === "in_review" && canReview && !isSelfReview ? (
          <Card className="border border-coral/40">
            <CardHeader>
              <CardTitle className="font-display text-base font-extrabold text-brand">
                Review decision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActionForm
                action={reviewContentAction}
                submitLabel="Record decision"
              >
                <input type="hidden" name="contentId" value={item.id} />
                <label className={FIELD_LABELS}>
                  <span>Decision</span>
                  <select
                    name="decision"
                    defaultValue="approve"
                    className={INPUT_CLASS}
                  >
                    <option value="approve">Approve</option>
                    <option value="reject">Request changes</option>
                  </select>
                </label>
                <label className={`${FIELD_LABELS} mt-4`}>
                  <span>Note to the author</span>
                  <textarea
                    name="note"
                    rows={3}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                  />
                  <span className="font-normal text-ink-muted">
                    A request for changes needs a note explaining what to fix.
                  </span>
                </label>
              </ActionForm>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Content details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mayEdit ? (
              <ActionForm action={saveContentAction} submitLabel="Save changes">
                <input type="hidden" name="contentId" value={item.id} />

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className={FIELD_LABELS}>
                    <span>Slug</span>
                    <input
                      type="text"
                      name="slug"
                      defaultValue={item.slug}
                      required
                      className={INPUT_CLASS}
                    />
                  </label>
                  <label className={FIELD_LABELS}>
                    <span>Type</span>
                    <select
                      name="contentType"
                      defaultValue={item.contentType}
                      className={INPUT_CLASS}
                    >
                      {CONTENT_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={FIELD_LABELS}>
                    <span>Featured</span>
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={item.featured}
                      className="size-5 rounded border border-line"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className={FIELD_LABELS}>
                    <span>Scheduled date (optional)</span>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      defaultValue={
                        item.scheduledAt ? item.scheduledAt.slice(0, 16) : ""
                      }
                      className={INPUT_CLASS}
                    />
                  </label>
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <p className="mb-3 font-black uppercase tracking-[0.14em] text-leaf">
                    English
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className={FIELD_LABELS}>
                      <span>Title</span>
                      <input
                        type="text"
                        name="titleEn"
                        defaultValue={item.en.title}
                        required
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className={FIELD_LABELS}>
                      <span>Excerpt</span>
                      <input
                        type="text"
                        name="excerptEn"
                        defaultValue={item.en.excerpt ?? ""}
                        className={INPUT_CLASS}
                      />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className={FIELD_LABELS}>
                      <span>SEO title</span>
                      <input
                        type="text"
                        name="seoTitleEn"
                        defaultValue={item.en.seoTitle ?? ""}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className={FIELD_LABELS}>
                      <span>SEO description</span>
                      <input
                        type="text"
                        name="seoDescriptionEn"
                        defaultValue={item.en.seoDescription ?? ""}
                        className={INPUT_CLASS}
                      />
                    </label>
                  </div>
                  <div className="mt-4">
                    <label className={FIELD_LABELS}>
                      <span>Body (JSON blocks)</span>
                      <textarea
                        name="bodyEnBlocks"
                        rows={12}
                        defaultValue={blocksJson(item.en.body)}
                        spellCheck={false}
                        className={TEXTAREA_CLASS}
                      />
                    </label>
                  </div>
                </div>

                {canEditTaxonomy ? (
                  <fieldset className="mt-6 border-t border-line pt-4">
                    <legend className="mb-3 font-black uppercase tracking-[0.14em] text-leaf">
                      Categories &amp; tags
                    </legend>
                    <input type="hidden" name="taxonomyPresent" value="1" />
                    {taxonomyOptions.categories.length === 0 &&
                    taxonomyOptions.tags.length === 0 ? (
                      <p className="text-xs text-ink-muted">
                        No categories or tags exist yet. Create them in{" "}
                        <Link
                          href="/admin/taxonomies"
                          className="font-bold text-brand hover:underline"
                        >
                          Categories &amp; tags
                        </Link>
                        .
                      </p>
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                            Categories
                          </p>
                          <ul className="mt-2 grid gap-2">
                            {taxonomyOptions.categories.map((category) => (
                              <li key={category.id}>
                                <label className="flex items-center gap-2 text-sm text-ink">
                                  <input
                                    type="checkbox"
                                    name="categoryIds"
                                    value={category.id}
                                    defaultChecked={item.categoryIds.includes(
                                      category.id,
                                    )}
                                    className="size-4 rounded border border-line"
                                  />
                                  {category.label}
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                            Tags
                          </p>
                          <ul className="mt-2 grid gap-2">
                            {taxonomyOptions.tags.map((tag) => (
                              <li key={tag.id}>
                                <label className="flex items-center gap-2 text-sm text-ink">
                                  <input
                                    type="checkbox"
                                    name="tagIds"
                                    value={tag.id}
                                    defaultChecked={item.tagIds.includes(
                                      tag.id,
                                    )}
                                    className="size-4 rounded border border-line"
                                  />
                                  {tag.label}
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </fieldset>
                ) : null}

                {item.status !== "draft" ? (
                  <p className="mt-4 text-xs font-bold text-coral">
                    Saving a material change returns this item to draft for
                    re-approval.
                  </p>
                ) : null}
              </ActionForm>
            ) : (
              <p className="text-sm text-ink-muted">
                You can read this work, but only its author or a content editor
                may change it.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border border-line">
            <CardHeader>
              <CardTitle className="font-display text-base font-extrabold text-brand">
                Revision history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.revisions.length === 0 ? (
                <EmptyState title="No revisions recorded yet." />
              ) : (
                <ul className="space-y-2 text-xs text-ink-muted">
                  {item.revisions.map((revision) => (
                    <li
                      key={revision.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>
                        <strong className="text-ink">
                          #{revision.revisionNo}
                        </strong>{" "}
                        - {formatDateTime(revision.createdAt)}
                      </span>
                      <span className="font-mono text-[10px]">
                        {revision.changedBy}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border border-line">
            <CardHeader>
              <CardTitle className="font-display text-base font-extrabold text-brand">
                Approval trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.approvals.length === 0 ? (
                <EmptyState title="No review decisions yet." />
              ) : (
                <ul className="space-y-3 text-xs">
                  {item.approvals.map((approval) => (
                    <li key={approval.id} className="rounded-xl bg-cream p-3">
                      <div className="flex items-center justify-between gap-3">
                        <StatusBadge
                          status={
                            approval.decision === "approved"
                              ? "approved"
                              : "rejected"
                          }
                          labels={
                            approval.decision === "approved"
                              ? { approved: "Approved" }
                              : { rejected: "Changes requested" }
                          }
                        />
                        <span className="text-ink-muted">
                          {formatDateTime(approval.decidedAt)}
                        </span>
                      </div>
                      {approval.note ? (
                        <p className="mt-2 text-ink-muted">“{approval.note}”</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-ink-muted">
          Every save creates an immutable snapshot (see revision history),
          recorded automatically — content history is never rewritten. Workflow
          state:{" "}
          <Badge variant="neutral">
            {CONTENT_STATUS_LABELS[item.status] ?? item.status}
          </Badge>
        </p>
      </div>
    </div>
  );
}
