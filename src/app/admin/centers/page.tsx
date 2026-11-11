import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import {
  listAdminCenters,
  type AdminCenterListItem,
} from "@/features/centers/admin-queries";
import { saveCenterAction } from "@/features/centers/actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Centers" };
export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

function Row({
  center,
  hrefBase,
}: {
  center: AdminCenterListItem;
  hrefBase: string;
}) {
  return (
    <tr className="border-t border-line/70">
      <td className="px-3 py-3 align-top">
        <p className="font-bold text-ink">{center.name}</p>
        {center.address ? (
          <p className="text-sm text-ink-muted">{center.address}</p>
        ) : null}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {center.city ?? "-"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {center.phone ?? "-"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {center.publicVisible ? "Public" : "Hidden"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {formatDate(center.updatedAt)}
      </td>
      <td className="px-3 py-3 text-right align-top">
        <Link
          href={`${hrefBase}/${center.id}`}
          className="font-bold text-brand hover:underline"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}

export default async function AdminCentersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const centers = await listAdminCenters(search);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Website"
        title="Centers"
        description="Physical center locations, contact details and public visibility."
      />
      <div className="mb-6">
        <ListToolbar
          action="/admin/centers"
          filters={[
            { type: "search", name: "q", label: "Search name", value: search },
          ]}
          submitLabel="Apply"
        />
      </div>
      {centers === null ? (
        <Card className="mb-6 border border-coral/40">
          <CardContent className="pt-5 text-sm text-ink-muted">
            The database is not connected, so the center list could not be
            loaded.
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Centers ({centers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", label: "Center" },
                { key: "address", label: "Address" },
                { key: "city", label: "City" },
                { key: "phone", label: "Phone" },
                { key: "visibility", label: "Visibility" },
                { key: "updated", label: "Updated" },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  srOnly: true,
                },
              ]}
              isEmpty={centers.length === 0}
              empty={
                <EmptyState
                  title="No centers yet."
                  description="Add the first center with the form below."
                />
              }
            >
              {centers.map((center) => (
                <Row key={center.id} center={center} hrefBase="/admin/centers" />
              ))}
            </DataTable>
          </CardContent>
        </Card>
      )}
      <Card className="border border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Add a center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={saveCenterAction} submitLabel="Create center">
            <input type="hidden" name="slug" defaultValue="" />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  required
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Slug</span>
                <input
                  type="text"
                  name="slug"
                  placeholder="e.g. yaounde-center"
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
                  required
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>City</span>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g. Yaounde"
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
                  placeholder="+237 22 22 22 22"
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="info@example.cm"
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
                  placeholder="https://"
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Opening hours</span>
                <input
                  type="text"
                  name="openingHours"
                  placeholder="Mon-Fri 8:00-17:00"
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
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Map media ID (optional)</span>
                <input
                  type="text"
                  name="mapMediaId"
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <label className={FIELD_LABELS}>
                <span>Description</span>
                <textarea
                  name="description"
                  rows={4}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Centers are visible on the public site as soon as they are saved.
            </p>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
