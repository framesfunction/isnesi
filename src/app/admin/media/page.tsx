import type { Metadata } from "next";
import NextImage from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { RIGHTS_LABELS, StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import {
  listAdminMedia,
  MEDIA_RIGHTS_STATUSES,
  type AdminMediaAsset,
} from "@/features/media/admin-queries";
import { uploadMediaAction } from "@/features/media/actions";
import { formatBytes, isImageMime } from "@/features/media/helpers";
export const metadata: Metadata = { title: "Media library" };
export const dynamic = "force-dynamic";
const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
const RIGHTS_OPTIONS = MEDIA_RIGHTS_STATUSES.map((status) => ({
  value: status,
  label: RIGHTS_LABELS[status] ?? status,
}));
function MediaCard({ asset }: { asset: AdminMediaAsset }) {
  const isImage = isImageMime(asset.mimeType);
  const missingAlt = isImage && !asset.altText;
  return (
    <Card className="border border-line">
      {" "}
      <CardContent className="p-4">
        {" "}
        <div className="relative mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
          {" "}
          {asset.publicUrl && isImage ? (
            <NextImage
              src={asset.publicUrl}
              alt={asset.altText ?? asset.fileName}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
          ) : (
            <FileText aria-hidden="true" className="size-10 text-ink-muted" />
          )}{" "}
        </div>{" "}
        <p className="truncate font-bold text-ink" title={asset.fileName}>
          {" "}
          {asset.fileName}{" "}
        </p>{" "}
        <p className="mt-0.5 text-xs text-ink-muted">
          {" "}
          {formatBytes(asset.byteSize)} · {formatDate(asset.createdAt)}{" "}
        </p>{" "}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {" "}
          <StatusBadge
            status={asset.rightsStatus}
            labels={RIGHTS_LABELS}
          />{" "}
          {missingAlt ? (
            <Badge variant="warning">Missing alt text</Badge>
          ) : null}{" "}
          {asset.usageCount > 0 ? (
            <Badge variant="neutral">Used {asset.usageCount}×</Badge>
          ) : null}{" "}
        </div>{" "}
        <Link
          href={`/admin/media/${asset.id}`}
          className="mt-3 inline-block text-sm font-bold text-brand hover:underline"
        >
          {" "}
          Edit details{" "}
        </Link>{" "}
      </CardContent>{" "}
    </Card>
  );
}
export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; rights?: string }>;
}) {
  const { allowed } = await requirePermission("media.manage", "/admin/media");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the media.manage permission."
      />
    );
  }
  const { q, rights } = await searchParams;
  const search = (q ?? "").trim().slice(0, 120);
  const rightsFilter = (rights ?? "").trim();
  const media = await listAdminMedia({ search, rightsStatus: rightsFilter });
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Website"
        title="Media library"
        description="Upload images and documents, record rights and consent, and keep alt text accurate so public content stays accessible and lawful."
      />{" "}
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/media"
          filters={[
            {
              type: "search",
              name: "q",
              label: "Search media",
              placeholder: "file name or alt text",
              value: search,
            },
            {
              type: "select",
              name: "rights",
              label: "Rights",
              value: rightsFilter,
              options: [{ value: "", label: "All rights" }, ...RIGHTS_OPTIONS],
            },
          ]}
          submitLabel="Filter"
        />{" "}
      </div>{" "}
      <Card className="mb-6 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Upload media{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <ActionForm action={uploadMediaAction} submitLabel="Upload media">
            {" "}
            <div className="grid gap-4 sm:grid-cols-2">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>File</span>{" "}
                <input
                  type="file"
                  name="file"
                  required
                  accept="image/jpeg,image/png,image/webp,image/avif,application/pdf,video/mp4,video/webm"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Rights status</span>{" "}
                <select
                  name="rightsStatus"
                  defaultValue="pending"
                  className={INPUT_CLASS}
                >
                  {" "}
                  {RIGHTS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {" "}
                      {option.label}{" "}
                    </option>
                  ))}{" "}
                </select>{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Alt text (required for images)</span>{" "}
                <input
                  type="text"
                  name="altText"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Credit</span>{" "}
                <input type="text" name="credit" className={INPUT_CLASS} />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Caption</span>{" "}
                <input
                  type="text"
                  name="caption"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Rights reference</span>{" "}
                <input
                  type="text"
                  name="rightsReference"
                  placeholder="licence or consent record"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Consent reference</span>{" "}
                <input
                  type="text"
                  name="consentReference"
                  placeholder="photo consent record"
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
            </div>{" "}
            <p className="mt-3 text-xs text-ink-muted">
              {" "}
              JPEG, PNG, WebP, AVIF or PDF, and MP4/WebM video up to 50 MB. Files
              land in the public bucket, so only upload material whose rights and
              consent are cleared.{" "}
            </p>{" "}
          </ActionForm>{" "}
        </CardContent>{" "}
      </Card>{" "}
      {media === null ? (
        <Card className="border border-coral/40">
          {" "}
          <CardContent className="p-6 text-sm text-ink-muted">
            {" "}
            The database is not connected, so the media library cannot be
            loaded. Configure Supabase and reload.{" "}
          </CardContent>{" "}
        </Card>
      ) : media.length === 0 ? (
        <EmptyState
          title="No media yet."
          description="Upload the first asset above. Only rights-cleared material may be published."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {" "}
          {media.map((asset) => (
            <MediaCard key={asset.id} asset={asset} />
          ))}{" "}
        </div>
      )}{" "}
    </div>
  );
}
