import type { Metadata } from "next";
import NextImage from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { RIGHTS_LABELS, StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import {
  getAdminMediaAsset,
  MEDIA_RIGHTS_STATUSES,
} from "@/features/media/admin-queries";
import { deleteMediaAction, updateMediaAction } from "@/features/media/actions";
import { formatBytes, isImageMime } from "@/features/media/helpers";

export const metadata: Metadata = { title: "Edit media" };

export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

const RIGHTS_OPTIONS = MEDIA_RIGHTS_STATUSES.map((status) => ({
  value: status,
  label: RIGHTS_LABELS[status] ?? status,
}));

export default async function AdminMediaDetailPage({
  params,
}: {
  params: Promise<{ mediaId: string }>;
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

  const { mediaId } = await params;
  const asset = await getAdminMediaAsset(mediaId);
  if (!asset) notFound();

  const isImage = isImageMime(asset.mimeType);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/admin/media"
          className="text-sm font-bold text-brand hover:underline"
        >
          ← Back to media library
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Media library"
        title={asset.fileName}
        description="Confirm rights and consent before this asset is used on the public website."
        actions={
          <StatusBadge status={asset.rightsStatus} labels={RIGHTS_LABELS} />
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
              {asset.publicUrl && isImage ? (
                <NextImage
                  src={asset.publicUrl}
                  alt={asset.altText ?? asset.fileName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-contain"
                />
              ) : (
                <span className="font-mono text-xs text-ink-muted">
                  {asset.mimeType ?? "file"}
                </span>
              )}
            </div>

            <dl className="mt-4 grid gap-2 text-xs text-ink-muted">
              <div className="flex justify-between gap-3">
                <dt>Type</dt>
                <dd className="font-mono">{asset.mimeType ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Size</dt>
                <dd>{formatBytes(asset.byteSize)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Dimensions</dt>
                <dd>
                  {asset.width && asset.height
                    ? `${asset.width}×${asset.height}`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Uploaded</dt>
                <dd>{formatDateTime(asset.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Storage path</dt>
                <dd className="truncate font-mono">{asset.objectPath}</dd>
              </div>
            </dl>

            {asset.publicUrl ? (
              <p className="mt-3 text-xs">
                <a
                  href={asset.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-brand hover:underline"
                >
                  Open public file
                </a>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Rights and metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={updateMediaAction} submitLabel="Save details">
              <input type="hidden" name="mediaId" value={asset.id} />
              <div className="grid gap-4">
                <label className={FIELD_LABELS}>
                  <span>Alt text (required for images)</span>
                  <input
                    type="text"
                    name="altText"
                    defaultValue={asset.altText ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Caption</span>
                  <input
                    type="text"
                    name="caption"
                    defaultValue={asset.caption ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Credit</span>
                  <input
                    type="text"
                    name="credit"
                    defaultValue={asset.credit ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Rights status</span>
                  <select
                    name="rightsStatus"
                    defaultValue={asset.rightsStatus}
                    className={INPUT_CLASS}
                  >
                    {RIGHTS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={FIELD_LABELS}>
                  <span>Rights reference</span>
                  <input
                    type="text"
                    name="rightsReference"
                    defaultValue={asset.rightsReference ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Consent reference</span>
                  <input
                    type="text"
                    name="consentReference"
                    defaultValue={asset.consentReference ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
            </ActionForm>
          </CardContent>
        </Card>

        <Card className="border border-line lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted">
            {asset.usage.length === 0 ? (
              <p>This asset is not referenced by any content yet.</p>
            ) : (
              <ul className="grid gap-2">
                {asset.usage.map((usage) => (
                  <li
                    key={`${usage.entityType}-${usage.entityId}-${usage.usageRole}`}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Badge variant="neutral">{usage.entityType}</Badge>
                    <span className="font-mono text-xs">{usage.entityId}</span>
                    <span className="text-xs">({usage.usageRole})</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-coral/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Delete asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              Deleting removes the file from storage and cannot be undone.
              Assets still referenced by content are protected.
            </p>
            <div className="mt-3">
              <ActionButton
                action={deleteMediaAction}
                hidden={{ mediaId: asset.id }}
                label="Delete media"
                variant="danger"
                confirm="Delete this asset permanently? This cannot be undone."
                disabled={asset.usage.length > 0}
              />
            </div>
            {asset.usage.length > 0 ? (
              <p className="mt-2 text-xs text-ink-muted">
                Remove the references above before deleting.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
