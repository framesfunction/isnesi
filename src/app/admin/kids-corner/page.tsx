import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  deleteKidsResourceAction,
  reviewKidsResourceAction,
  saveKidsResourceAction,
  toggleKidsFeaturedAction,
} from "@/features/kids/actions";
import {
  listAdminKidsResources,
  type AdminKidsResourceListItem,
} from "@/features/kids/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
import {
  KIDS_RESOURCE_TYPES,
  KIDS_CONTENT_STATUSES,
} from "@/lib/validation/kids";
import { formatDate } from "@/lib/format";
export const metadata: Metadata = { title: "Kids&apos; Corner" };
export const dynamic = "force-dynamic";
const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};
const TYPE_LABELS: Record<string, string> = {
  story: "Story",
  activity: "Activity",
  game: "Game",
  video: "Video",
  download: "Download",
};
type PageSearchParams = { status?: string; type?: string };
/* Plain form actions (single FormData argument) */ async function handleReviewKidsResource(
  formData: FormData,
): Promise<void> {
  "use server";
  await reviewKidsResourceAction(undefined, formData);
}
async function handleToggleKidsFeatured(formData: FormData): Promise<void> {
  "use server";
  await toggleKidsFeaturedAction(undefined, formData);
}
async function handleDeleteKidsResource(formData: FormData): Promise<void> {
  "use server";
  await deleteKidsResourceAction(undefined, formData);
}
function ReviewForm({ resource }: { resource: AdminKidsResourceListItem }) {
  return (
    <div className="flex gap-2">
      {" "}
      <form action={handleReviewKidsResource} className="inline">
        {" "}
        <input type="hidden" name="resourceId" value={resource.id} />{" "}
        <input type="hidden" name="decision" value="approve" />{" "}
        <Button
          type="submit"
          size="sm"
          variant="default"
          disabled={resource.safeguardingApproved}
        >
          {" "}
          Approve{" "}
        </Button>{" "}
      </form>{" "}
      <form action={handleReviewKidsResource} className="inline">
        {" "}
        <input type="hidden" name="resourceId" value={resource.id} />{" "}
        <input type="hidden" name="decision" value="reject" />{" "}
        <Button type="submit" size="sm" variant="outline">
          {" "}
          Reject{" "}
        </Button>{" "}
      </form>{" "}
    </div>
  );
}
function FeaturedForm({ resource }: { resource: AdminKidsResourceListItem }) {
  if (!resource.safeguardingApproved) {
    return <span className="text-[10px] text-ink-muted">Not cleared</span>;
  }
  return (
    <form action={handleToggleKidsFeatured} className="inline">
      {" "}
      <input type="hidden" name="resourceId" value={resource.id} />{" "}
      <input type="hidden" name="featured" value={String(!resource.featured)} />{" "}
      <Button
        type="submit"
        size="sm"
        variant={resource.featured ? "destructive" : "default"}
      >
        {" "}
        {resource.featured ? "Unfeature" : "Feature"}{" "}
      </Button>{" "}
    </form>
  );
}
function DeleteForm({ resourceId }: { resourceId: string }) {
  return (
    <form
      action={handleDeleteKidsResource}
      className="inline"
      onSubmit={(e) => {
        if (
          !window.confirm("Delete this kids resource? This cannot be undone.")
        ) {
          e.preventDefault();
        }
      }}
    >
      {" "}
      <input type="hidden" name="resourceId" value={resourceId} />{" "}
      <Button type="submit" size="sm" variant="destructive">
        {" "}
        Delete{" "}
      </Button>{" "}
    </form>
  );
}
function Row({ resource }: { resource: AdminKidsResourceListItem }) {
  return (
    <tr key={resource.id} className="border-t border-line/70">
      {" "}
      <td className="px-3 py-3 align-top font-bold text-ink">
        {" "}
        {resource.title ?? "(untitled)"}{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {TYPE_LABELS[resource.resourceType] ?? resource.resourceType}{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <StatusBadge status={resource.status} labels={STATUS_LABELS} />{" "}
          {resource.safeguardingApproved ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-leaf-strong bg-leaf-soft/60 rounded-full px-2 py-0.5">
              {" "}
              Cleared{" "}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-coral-strong bg-coral/10 rounded-full px-2 py-0.5">
              {" "}
              Pending{" "}
            </span>
          )}{" "}
        </div>{" "}
        <ReviewForm resource={resource} />{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {resource.minAge ?? "&mdash;"} &ndash;{" "}
        {resource.maxAge ?? "&mdash;"}{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {formatDate(resource.updatedAt)}{" "}
      </td>{" "}
      <td className="px-3 py-3 text-right align-top">
        {" "}
        <FeaturedForm resource={resource} />{" "}
        <LinkEdit resourceId={resource.id} />{" "}
        <DeleteForm resourceId={resource.id} />{" "}
      </td>{" "}
    </tr>
  );
}
function LinkEdit({ resourceId }: { resourceId: string }) {
  return (
    <a
      href={`/admin/kids-corner/${resourceId}`}
      className="text-sm font-bold text-brand hover:underline"
    >
      {" "}
      Edit{" "}
    </a>
  );
}
export default async function AdminKidsCornerPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { allowed } = await requirePermission(
    "kids.manage",
    "/admin/kids-corner",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the kids.manage permission."
      />
    );
  }
  const params = await searchParams;
  const status = (params.status ?? "").trim();
  const type = (params.type ?? "").trim();
  const resources = await listAdminKidsResources();
  if (resources === null) {
    return (
      <Card className="border border-coral/40">
        {" "}
        <CardContent className="p-6 text-sm text-ink-muted">
          {" "}
          The database is not connected, so Kids&apos; Corner could not be
          loaded. Configure Supabase and reload.{" "}
        </CardContent>{" "}
      </Card>
    );
  }
  const filtered = resources.filter((r) => {
    if (status && r.status !== status) return false;
    if (type && r.resourceType !== type) return false;
    return true;
  });
  const unapprovedCount = filtered.filter(
    (r) => !r.safeguardingApproved,
  ).length;
  const approvedCount = filtered.filter((r) => r.safeguardingApproved).length;
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Engagement"
        title="Kids' Corner"
        description="Child-facing resources with mandatory safeguarding review before publication."
      />{" "}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {" "}
        <Card className="border border-line rounded-xl p-4">
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Total resources
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">
            {filtered.length}
          </p>{" "}
        </Card>{" "}
        <Card className="border border-line rounded-xl p-4">
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Safeguarding cleared
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-leaf-strong">
            {approvedCount}
          </p>{" "}
        </Card>{" "}
        <Card className="border border-line rounded-xl p-4">
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Awaiting review
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-coral-strong">
            {unapprovedCount}
          </p>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/kids-corner"
          filters={[
            {
              type: "select",
              name: "status",
              label: "Workflow",
              value: status,
              options: [
                { value: "", label: "All statuses" },
                ...KIDS_CONTENT_STATUSES.map((value) => ({
                  value,
                  label: STATUS_LABELS[value],
                })),
              ],
            },
            {
              type: "select",
              name: "type",
              label: "Resource type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...KIDS_RESOURCE_TYPES.map((value) => ({
                  value,
                  label: TYPE_LABELS[value],
                })),
              ],
            },
          ]}
          submitLabel="Apply"
        />{" "}
      </div>{" "}
      <Card className="mb-8 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Resources ({filtered.length}){" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <DataTable
            columns={[
              { key: "title", label: "Title" },
              { key: "type", label: "Type" },
              { key: "status", label: "Safeguarding" },
              { key: "age", label: "Age range" },
              { key: "updated", label: "Updated" },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                srOnly: true,
              },
            ]}
            isEmpty={filtered.length === 0}
            empty={
              <EmptyState
                title="No resources found."
                description={
                  status || type
                    ? "Try a different filter."
                    : "Add your first kids resource below."
                }
              />
            }
          >
            {" "}
            {filtered.map((resource) => (
              <Row key={resource.id} resource={resource} />
            ))}{" "}
          </DataTable>{" "}
        </CardContent>{" "}
      </Card>{" "}
      <Card className="border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Add a kids resource{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <ActionForm
            action={saveKidsResourceAction}
            submitLabel="Create resource"
          >
            {" "}
            <input type="hidden" name="resourceId" value="" />{" "}
            <div className="grid gap-4 sm:grid-cols-3">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Type</span>{" "}
                <select
                  name="resourceType"
                  defaultValue="story"
                  className={INPUT_CLASS}
                >
                  {" "}
                  {KIDS_RESOURCE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {" "}
                      {TYPE_LABELS[value]}{" "}
                    </option>
                  ))}{" "}
                </select>{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Title</span>{" "}
                <input
                  type="text"
                  name="title"
                  required
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
            </div>{" "}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Minimum age</span>{" "}
                <input
                  type="number"
                  name="minAge"
                  placeholder="e.g. 3"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Maximum age</span>{" "}
                <input
                  type="number"
                  name="maxAge"
                  placeholder="e.g. 8"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
            </div>{" "}
            <div className="mt-4 space-y-3">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Description</span>{" "}
                <textarea
                  name="description"
                  rows={4}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                />{" "}
              </label>{" "}
            </div>{" "}
            <div className="mt-4 flex items-start gap-2">
              {" "}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                {" "}
                <input
                  type="checkbox"
                  name="featured"
                  className="form-checkbox"
                />{" "}
                Featured on public Kids&apos; Corner{" "}
              </label>{" "}
            </div>{" "}
            <p className="mt-3 text-xs text-ink-muted">
              {" "}
              New resources start as draft. Submit them for safeguarding review;
              only safeguarding-approved resources can be published or
              featured.{" "}
            </p>{" "}
          </ActionForm>{" "}
        </CardContent>{" "}
      </Card>{" "}
    </div>
  );
}
