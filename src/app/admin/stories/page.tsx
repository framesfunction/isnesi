import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  StatusBadge,
  CONTENT_STATUS_LABELS,
} from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_TYPES } from "@/lib/validation/cms";
import { requirePermission } from "@/lib/auth/guards";
import {
  listAdminContent,
  type AdminContentListItem,
} from "@/features/editorial/admin-queries";
import { saveContentAction } from "@/features/editorial/actions";
import { formatDateTime } from "@/lib/format";
export const metadata: Metadata = { title: "Stories & news" };
export const dynamic = "force-dynamic";
const JSON_PLACEHOLDER =
  '[{ "type": "paragraph", "text": "Opening paragraph" }]';
const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
type PageSearchParams = { q?: string; type?: string; status?: string };
function Row({
  item,
  hrefBase,
}: {
  item: AdminContentListItem;
  hrefBase: string;
}) {
  return (
    <tr className="border-t border-line/70">
      {" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <p className="font-bold text-ink">{item.title ?? "(untitled)"}</p>{" "}
        <p className="font-mono text-xs text-ink-muted">
          /stories/{item.slug}
        </p>{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {item.contentType}
      </td>{" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <StatusBadge status={item.status} />{" "}
      </td>
      {" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {formatDateTime(item.updatedAt)}
      </td>{" "}
      <td className="px-3 py-3 text-right align-top">
        {" "}
        <Link
          href={`${hrefBase}/${item.id}`}
          className="font-bold text-brand hover:underline"
        >
          {" "}
          Edit{" "}
        </Link>
      </td>
    </tr>
  );
}
export default async function AdminStoriesListPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
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
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const type = (params.type ?? "").trim();
  const status = (params.status ?? "").trim();
  const items = await listAdminContent(search, type, status);
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Website"
        title="Stories & news"
        description="Draft, submit, review and publish stories, news, announcements and policy notices."
      />{" "}
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/stories"
          filters={[
            { type: "search", name: "q", label: "Search title", value: search },
            {
              type: "select",
              name: "type",
              label: "Type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...CONTENT_TYPES.map((value) => ({ value, label: value })),
              ],
            },
            {
              type: "select",
              name: "status",
              label: "Workflow",
              value: status,
              options: [
                { value: "", label: "All statuses" },
                ...Object.entries(CONTENT_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label }),
                ),
              ],
            },
          ]}
          submitLabel="Apply"
        />{" "}
      </div>{" "}
      {items === null ? (
        <Card className="mb-6 border border-coral/40">
          {" "}
          <CardContent className="pt-5 text-sm text-ink-muted">
            {" "}
            The database is not connected, so the editorial list could not be
            loaded.{" "}
          </CardContent>{" "}
        </Card>
      ) : (
        <>
        <Card className="mb-8">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="font-display text-base font-extrabold text-brand">
              {" "}
              Content ({(items ?? []).length}){" "}
            </CardTitle>
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <DataTable
              columns={[
                { key: "title", label: "Title / slug" },
                { key: "type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "updated", label: "Updated" },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  srOnly: true,
                },
              ]}
              isEmpty={(items ?? []).length === 0}
              empty={
                <EmptyState
                  title="No content yet."
                  description="Create the first story, news item or announcement below."
                />
              }
            >
              {" "}
              {(items ?? []).map((item) => (
                <Row key={item.id} item={item} hrefBase="/admin/stories" />
              ))}
            </DataTable>{" "}
          </CardContent>{" "}
          </Card>
          <Card className="border border-line">
            {" "}
            <CardHeader>
              {" "}
              <CardTitle className="font-display text-base font-extrabold text-brand">
                {" "}
                New content{" "}
              </CardTitle>
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <ActionForm action={saveContentAction} submitLabel="Create draft">
                {" "}
                <input type="hidden" name="contentId" value="" />{" "}
                <div className="grid gap-4 sm:grid-cols-3">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Slug</span>{" "}
                    <input
                      type="text"
                      name="slug"
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      className={INPUT_CLASS}
                    />{" "}
                  </label>{" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Type</span>{" "}
                    <select
                      name="contentType"
                      defaultValue="story"
                      className={INPUT_CLASS}
                    >
                      {" "}
                      {CONTENT_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {" "}
                          {value}{" "}
                        </option>
                      ))}
                    </select>{" "}
                  </label>{" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Featured</span>{" "}
                    <input
                      type="checkbox"
                      name="featured"
                      className="size-5 rounded border border-line"
                    />{" "}
                  </label>{" "}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>English title</span>{" "}
                    <input
                      type="text"
                      name="titleEn"
                      required
                      className={INPUT_CLASS}
                    />{" "}
                  </label>{" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Scheduled date (optional)</span>{" "}
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      className={INPUT_CLASS}
                    />{" "}
                  </label>{" "}
                </div>
                <div className="mt-4">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Body (JSON blocks)</span>{" "}
                    <textarea
                      name="bodyEnBlocks"
                      rows={8}
                      defaultValue={JSON_PLACEHOLDER}
                      spellCheck={false}
                      className="rounded-xl border border-line bg-white px-3 py-2 font-mono text-xs text-ink"
                    />{" "}
                  </label>
                </div>
                <p className="mt-3 text-xs text-ink-muted">
                  {" "}
                  Saving starts a new draft. Submit it for review from the editor
                  once it is ready; publishing and archiving need the
                  content.publish permission.{" "}
                </p>
              </ActionForm>{" "}
            </CardContent>{" "}
          </Card>
        </>
      )}
    </div>
  );
}
