import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getAdminCenter } from "@/features/centers/admin-queries";
import {
  deleteCenterAction,
  saveCenterAction,
} from "@/features/centers/actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit center" };
export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

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

  return (
    <div className="mx-auto max-w-4xl">
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
