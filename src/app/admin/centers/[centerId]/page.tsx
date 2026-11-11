import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CenterMediaAdder } from "@/components/admin/center-media-adder";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getAdminCenter } from "@/features/centers/admin-queries";
import type { AdminCenterMediaItem } from "@/features/centers/admin-queries";
import {
  deleteCenterAction,
  removeCenterMediaAction,
  reorderCenterMediaAction,
  saveCenterAction,
  setCenterCoverAction,
} from "@/features/centers/actions";
import { formatDate } from "@/lib/format";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Edit center" };
export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

function MediaRow({
  media,
  centerId,
}: {
  media: AdminCenterMediaItem;
  centerId: string;
}) {
  const isImage = media.mediaType === "image";
  return (
    <tr key={media.id} className="border-t border-line/70">
      <td className="px-3 py-3 align-top">
        {media.isCover ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2 py-0.5 text-[10px] font-bold text-leaf-strong">
            Cover
          </span>
        ) : null}
        {isImage && media.publicUrl ? (
          <img
            src={media.publicUrl}
            alt={media.fileName ?? "Center media"}
            className="mt-2 h-16 w-24 rounded-lg object-cover border border-line"
            loading="lazy"
          />
        ) : !isImage ? (
          <div className="mt-2 h-16 w-24 rounded-lg bg-muted flex items-center justify-center text-xs text-ink-muted">
            🎬
          </div>
        ) : null}
      </td>
      <td className="px-3 py-3 align-top text-sm text-ink-muted">
        {media.fileName ?? "-"}
      </td>
      <td className="px-3 py-3 align-top">
        <p className="text-sm text-ink">{media.caption ?? "-"}</p>
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {media.mediaType}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {media.isCover ? "Cover" : "Gallery"}
      </td>
      <td className="px-3 py-3 align-top text-right">
        <div className="flex items-center gap-1">
          <ActionButton
            action={reorderCenterMediaAction}
            hidden={{
              centerId,
              itemId: media.id,
              direction: "up",
            }}
            label="↑"
            variant="outline"
          />
          <ActionButton
            action={reorderCenterMediaAction}
            hidden={{
              centerId,
              itemId: media.id,
              direction: "down",
            }}
            label="↓"
            variant="outline"
          />
          {media.isCover ? null : (
            <ActionButton
              action={setCenterCoverAction}
              hidden={{ centerId, itemId: media.id }}
              label="★"
              variant="ghost"
            />
          )}
          <ActionButton
            action={removeCenterMediaAction}
            hidden={{ centerId, mediaAssetId: media.mediaAssetId }}
            label="×"
            variant="danger"
            confirm="Remove this media from the center gallery?"
          />
        </div>
      </td>
    </tr>
  );
}

export default async function AdminCenterEditorPage({
  params,
}: {
  params: Promise<{ centerId: string }>;
}) {
  const { allowed } = await requirePermission(
    "centers.manage",
    "/admin/centers",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the centers.manage permission."
      />
    );
  }

  const { centerId } = await params;
  const center = await getAdminCenter(centerId);
  if (!center) notFound();

  function onMediaAdded() {
    revalidatePath(`/admin/centers/${centerId}`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4">
        <Link
          href="/admin/centers"
          className="text-sm font-bold text-brand hover:underline"
        >
          ← Back to centers
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Website / Centers"
        title={center.name}
        description={center.address}
        actions={
          <span
            className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-bold ${
              center.publicVisible ? "border-brand text-brand" : "border-line text-ink-muted"
            }`}
          >
            {center.publicVisible ? "Public" : "Hidden"}
          </span>
        }
      />

      <p className="mb-6 text-xs text-ink-muted">
        <Link
          href="/admin/centers"
          className="font-bold text-brand hover:underline"
        >
          Back to centers
        </Link>{" - "}Updated {formatDate(center.updatedAt)}
      </p>

      <div className="space-y-8">
        {/* Center details form */}
        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Center details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={saveCenterAction} submitLabel="Save center">
              <input type="hidden" name="centerId" value={center.id} />
              <input type="hidden" name="slug" value={center.slug} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={FIELD_LABELS}>
                  <span>Name</span>
                  <input
                    type="text"
                    name="name"
                    defaultValue={center.name}
                    required
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Slug</span>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={center.slug}
                    required
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={FIELD_LABELS}>
                  <span>Address</span>
                  <input
                    type="text"
                    name="address"
                    defaultValue={center.address}
                    required
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>City</span>
                  <input
                    type="text"
                    name="city"
                    defaultValue={center.city ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={FIELD_LABELS}>
                  <span>Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={center.phone ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    defaultValue={center.email ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={FIELD_LABELS}>
                  <span>Website URL</span>
                  <input
                    type="url"
                    name="websiteUrl"
                    defaultValue={center.websiteUrl ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Opening hours</span>
                  <input
                    type="text"
                    name="openingHours"
                    defaultValue={center.openingHours ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className={FIELD_LABELS}>
                  <span>Logo media ID (optional)</span>
                  <input
                    type="text"
                    name="logoMediaId"
                    defaultValue={center.logoMediaId ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Map media ID (optional)</span>
                  <input
                    type="text"
                    name="mapMediaId"
                    defaultValue={center.mapMediaId ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
              </div>
              <div className="mt-4 space-y-3">
                <label className={FIELD_LABELS}>
                  <span>Description</span>
                  <textarea
                    name="description"
                    rows={5}
                    defaultValue={center.description ?? ""}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                Changes are visible on the public site immediately.
              </p>
            </ActionForm>
          </CardContent>
        </Card>

        {/* Media gallery */}
        <Card className="border border-brand/30">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Media gallery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CenterMediaAdder centerId={centerId} onAdded={onMediaAdded} />

            {center.media.length === 0 ? (
              <div className="mt-6 py-8 text-center text-ink-muted">
                <p>No media yet. Add images and videos to build the center gallery.</p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line/70">
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Media</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">File</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Caption</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Type</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">Role</th>
                      <th className="px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink-muted text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {center.media.map((media) => (
                      <MediaRow key={media.id} media={media} centerId={centerId} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete zone */}
        <Card className="border border-coral/40">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-coral">
              Danger zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionButton
              action={deleteCenterAction}
              hidden={{ centerId: center.id }}
              label="Delete center"
              variant="danger"
              confirm={`Delete ${center.name}? This cannot be undone.`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
