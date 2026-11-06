import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGE_TYPES } from "@/lib/validation/cms";
import { requirePermission } from "@/lib/auth/guards";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions/can";
import {
  getAdminPage,
  type AdminPageSection,
} from "@/features/pages/admin-queries";
import {
  archivePageAction,
  deletePageAction,
  deleteSectionAction,
  publishPageAction,
  reorderSectionAction,
  saveSectionAction,
  toggleSectionVisibilityAction,
  unpublishPageAction,
  updatePageAction,
} from "@/features/pages/actions";
import { BlockEditor } from "@/components/admin/block-editor";
import { parseEditorBlocks } from "@/lib/validation/blocks";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Edit page" };

export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

function SectionCard({
  pageId,
  section,
  order,
}: {
  pageId: string;
  section: AdminPageSection;
  order: number;
}) {
  const isText = section.sectionType === "text";
  const config = section.config;

  return (
    <Card className="border border-line">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-3 font-display text-sm font-extrabold text-brand">
          <span>#{section.sortOrder}</span>
          <span className="font-mono text-xs">{section.sectionKey}</span>
          <Badge variant="neutral">{section.sectionType}</Badge>
          {section.isEnabled ? (
            <Badge variant="success">Enabled</Badge>
          ) : (
            <Badge variant="warning">Hidden</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActionForm
          action={saveSectionAction}
          submitLabel="Save section"
          successMessage="Section saved."
        >
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="sectionId" value={section.id} />
          <input type="hidden" name="kind" value={section.sectionType} />

          <div className="grid gap-4 sm:grid-cols-3">
            <label className={FIELD_LABELS}>
              <span>Section key</span>
              <input
                type="text"
                name="sectionKey"
                defaultValue={section.sectionKey}
                required
                className={INPUT_CLASS}
              />
            </label>
            <label className={FIELD_LABELS}>
              <span>Sort order</span>
              <input
                type="number"
                name="sortOrder"
                defaultValue={section.sortOrder}
                className={INPUT_CLASS}
              />
            </label>
            <label className={`${FIELD_LABELS} justify-start`}>
              <span>Enabled</span>
              <input
                type="checkbox"
                name="isEnabled"
                defaultChecked={section.isEnabled}
                className="size-5 rounded border border-line"
              />
            </label>
          </div>

          {isText ? (
            <div className="mt-4 space-y-3">
              <label className={FIELD_LABELS}>
                <span>Heading (optional)</span>
                <input
                  type="text"
                  name="heading"
                  defaultValue={
                    typeof (config as { heading?: unknown })?.heading ===
                    "string"
                      ? (config as { heading: string }).heading
                      : ""
                  }
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Text</span>
                <textarea
                  name="text"
                  rows={5}
                  defaultValue={
                    typeof (config as { text?: unknown })?.text === "string"
                      ? (config as { text: string }).text
                      : ""
                  }
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className={FIELD_LABELS}>
                <span>Content blocks</span>
                <BlockEditor
                  name="body"
                  value={parseEditorBlocks((config as { blocks?: unknown })?.blocks)}
                />
                <p className="text-xs text-ink-muted">
                  Blocks are heading, paragraph, list, quote, callout and image.
                </p>
              </label>
            </div>
          )}
        </ActionForm>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ActionButton
            action={reorderSectionAction}
            hidden={{ pageId, sectionId: section.id, direction: "up" }}
            label="Move up"
            disabled={order === 0}
          />
          <ActionButton
            action={reorderSectionAction}
            hidden={{ pageId, sectionId: section.id, direction: "down" }}
            label="Move down"
          />
          <ActionButton
            action={toggleSectionVisibilityAction}
            hidden={{
              pageId,
              sectionId: section.id,
              isEnabled: !section.isEnabled,
            }}
            label={section.isEnabled ? "Hide" : "Show"}
          />
          <ActionButton
            action={deleteSectionAction}
            hidden={{ pageId, sectionId: section.id }}
            label="Delete"
            variant="danger"
            confirm={`Delete section "${section.sectionKey}"? This cannot be undone.`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminPageEditorPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { allowed } = await requirePermission("pages.manage", "/admin/pages");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the pages.manage permission."
      />
    );
  }

  const { pageId } = await params;
  const page = await getAdminPage(pageId);
  if (!page) notFound();

  const user = await getCurrentUser();
  const canPublish = can(user, "content.publish");

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow="Website / Pages"
        title={page.title ?? page.slug}
        description={`/${page.slug} - ${page.pageType}`}
        actions={<StatusBadge status={page.status} />}
      />

      <p className="mb-6 text-xs text-ink-muted">
        <Link
          href="/admin/pages"
          className="font-bold text-brand hover:underline"
        >
          Back to all pages
        </Link>
        {" - "}Updated {formatDateTime(page.updatedAt)}
        {page.publishedAt
          ? ` - Published ${formatDateTime(page.publishedAt)}`
          : ""}
      </p>

      <div className="space-y-8">
        <Card className="border border-brand/30">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Publication
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canPublish ? (
              <div className="flex flex-wrap items-center gap-2">
                <ActionButton
                  action={publishPageAction}
                  hidden={{ pageId: page.id }}
                  label="Publish"
                  variant="default"
                  confirm="Publish this page to the public site?"
                />
                <ActionButton
                  action={unpublishPageAction}
                  hidden={{ pageId: page.id }}
                  label="Unpublish (back to draft)"
                />
                <ActionButton
                  action={archivePageAction}
                  hidden={{ pageId: page.id }}
                  label="Archive"
                  variant="danger"
                  confirm="Archive this page? It will be removed from the site and navigation."
                />
              </div>
            ) : (
              <p className="text-xs text-ink-muted">
                Editing is available with your permissions; publishing requires
                the content.publish permission.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 border border-coral/40">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Delete page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              Deleting is permanent. Pages referenced by navigation cannot be
              deleted — archive them instead.
            </p>
            <div className="mt-3">
              <ActionButton
                action={deletePageAction}
                hidden={{ pageId: page.id }}
                label="Delete page"
                variant="danger"
                confirm={`Delete "${page.title ?? page.slug}" permanently? This cannot be undone.`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Page details & translations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={updatePageAction} submitLabel="Save draft">
              <input type="hidden" name="pageId" value={page.id} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className={FIELD_LABELS}>
                  <span>Slug</span>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={page.slug}
                    required
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Page type</span>
                  <select
                    name="pageType"
                    defaultValue={page.pageType}
                    className={INPUT_CLASS}
                  >
                    {PAGE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={FIELD_LABELS}>
                  <span>Sort order</span>
                  <input
                    type="number"
                    name="sortOrder"
                    defaultValue={page.sortOrder}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>

              <label className={`${FIELD_LABELS} mt-3 justify-start`}>
                <span>Show in navigation</span>
                <input
                  type="checkbox"
                  name="showInNavigation"
                  defaultChecked={page.showInNavigation}
                  className="size-5 rounded border border-line"
                />
              </label>

              <div className="mt-6 border-t border-line pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={FIELD_LABELS}>
                    <span>Title</span>
                    <input
                      type="text"
                      name="titleEn"
                      defaultValue={page.title}
                      required
                      className={INPUT_CLASS}
                    />
                  </label>
                  <label className={FIELD_LABELS}>
                    <span>Excerpt</span>
                    <input
                      type="text"
                      name="excerptEn"
                      defaultValue={page.excerpt ?? ""}
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
                      defaultValue={page.seoTitle ?? ""}
                      className={INPUT_CLASS}
                    />
                  </label>
                  <label className={FIELD_LABELS}>
                    <span>SEO description</span>
                    <input
                      type="text"
                      name="seoDescriptionEn"
                      defaultValue={page.seoDescription ?? ""}
                      className={INPUT_CLASS}
                    />
                  </label>
                </div>
                <div className="mt-4">
                  <label className={FIELD_LABELS}>
                    <span>Body (content blocks)</span>
                    <BlockEditor
                      name="bodyEnBlocks"
                      value={parseEditorBlocks(page.body)}
                    />
                    <p className="text-xs text-ink-muted">
                      Blocks are heading, paragraph, list, quote, callout and
                      image. Images are picked from the media library.
                    </p>
                  </label>
                </div>
              </div>
            </ActionForm>
          </CardContent>
        </Card>

        <div>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display text-lg font-extrabold text-brand">
              Sections
            </h2>
            <Badge variant="neutral">{page.sections.length}</Badge>
          </div>

          <div className="space-y-5">
            {page.sections.length === 0 ? (
              <EmptyState
                title="No sections yet."
                description="Add the first section with the form below; ordered sections appear on the public page."
              />
            ) : (
              page.sections.map((section, index) => (
                <SectionCard
                  key={section.id}
                  pageId={page.id}
                  section={section}
                  order={index}
                />
              ))
            )}
          </div>
        </div>

        <Card className="border border-dashed border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Add a section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={saveSectionAction} submitLabel="Add section">
              <input type="hidden" name="pageId" value={page.id} />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className={FIELD_LABELS}>
                  <span>Type</span>
                  <select
                    name="kind"
                    defaultValue="text"
                    className={INPUT_CLASS}
                  >
                    <option value="text">text</option>
                    <option value="blocks">blocks</option>
                  </select>
                </label>
                <label className={FIELD_LABELS}>
                  <span>Section key</span>
                  <input
                    type="text"
                    name="sectionKey"
                    required
                    placeholder="e.g. opening"
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Sort order</span>
                  <input
                    type="number"
                    name="sortOrder"
                    defaultValue={(page.sections.length + 1) * 10}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>

              <label className={`${FIELD_LABELS} mt-3 justify-start`}>
                <span>Enabled</span>
                <input
                  type="checkbox"
                  name="isEnabled"
                  defaultChecked
                  className="size-5 rounded border border-line"
                />
              </label>

              <div className="mt-4 space-y-3">
                <label className={FIELD_LABELS}>
                  <span>Heading (text sections)</span>
                  <input type="text" name="heading" className={INPUT_CLASS} />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Text (text sections)</span>
                  <textarea
                    name="text"
                    rows={4}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Content blocks (blocks sections)</span>
                  <BlockEditor name="body" value={[]} />
                  <p className="text-xs text-ink-muted">
                    Blocks are heading, paragraph, list, quote, callout and
                    image. Images are picked from the media library.
                  </p>
                </label>
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
