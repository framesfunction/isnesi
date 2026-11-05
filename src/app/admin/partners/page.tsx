import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge, APPROVAL_LABELS } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminPartners, type AdminPartnerListItem } from "@/features/partners/admin-queries";
import { savePartnerAction } from "@/features/partners/actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Partners" };

export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

function Row({ partner, hrefBase }: { partner: AdminPartnerListItem; hrefBase: string }) {
  return (
    <tr className="border-t border-line/70">
      <td className="px-3 py-3 align-top">
        <p className="font-bold text-ink">{partner.name}</p>
        {partner.websiteUrl ? (
          <p className="font-mono text-xs text-ink-muted">{partner.websiteUrl}</p>
        ) : null}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {partner.relationshipType ?? "-"}
      </td>
      <td className="px-3 py-3 align-top">
        <StatusBadge status={partner.approvalStatus} labels={APPROVAL_LABELS} />
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {partner.publicVisible ? "Public" : "Hidden"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {formatDate(partner.updatedAt)}
      </td>
      <td className="px-3 py-3 text-right align-top">
        <Link href={`${hrefBase}/${partner.id}`} className="font-bold text-brand hover:underline">
          Edit
        </Link>
      </td>
    </tr>
  );
}

export default async function AdminPartnersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { allowed } = await requirePermission("partners.manage", "/admin/partners");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the partners.manage permission."
      />
    );
  }

  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const status = (params.status ?? "").trim();
  const partners = await listAdminPartners(search, status);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Website"
        title="Partners"
        description="Partner organisations, their approved public representation and visibility."
      />

      <div className="mb-6">
        <ListToolbar
          action="/admin/partners"
          filters={[
            { type: "search", name: "q", label: "Search name", value: search },
            {
              type: "select",
              name: "status",
              label: "Approval",
              value: status,
              options: [
                { value: "", label: "All statuses" },
                ...Object.entries(APPROVAL_LABELS).map(([value, label]) => ({ value, label })),
              ],
            },
          ]}
          submitLabel="Apply"
        />
      </div>

      {partners === null ? (
        <Card className="mb-6 border-2 border-coral/40">
          <CardContent className="pt-5 text-sm text-ink-muted">
            The database is not connected, so the partner list could not be loaded.
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Partners ({partners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", label: "Partner" },
                { key: "relationship", label: "Relationship" },
                { key: "approval", label: "Approval" },
                { key: "visibility", label: "Visibility" },
                { key: "updated", label: "Updated" },
                { key: "actions", label: "Actions", align: "right", srOnly: true },
              ]}
              isEmpty={partners.length === 0}
              empty={
                <EmptyState
                  title="No partners yet."
                  description="Add the first partner with the form below."
                />
              }
            >
              {partners.map((partner) => (
                <Row key={partner.id} partner={partner} hrefBase="/admin/partners" />
              ))}
            </DataTable>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Add a partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={savePartnerAction} submitLabel="Create partner">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Name</span>
                <input type="text" name="name" required className={INPUT_CLASS} />
              </label>
              <label className={FIELD_LABELS}>
                <span>Relationship type</span>
                <input
                  type="text"
                  name="relationshipType"
                  placeholder="e.g. implementing partner"
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Website URL</span>
                <input type="url" name="websiteUrl" placeholder="https://" className={INPUT_CLASS} />
              </label>
              <label className={FIELD_LABELS}>
                <span>Logo media ID (optional)</span>
                <input type="text" name="logoMediaId" className={INPUT_CLASS} />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <label className={FIELD_LABELS}>
                <span>Description</span>
                <textarea
                  name="description"
                  rows={4}
                  className="rounded-xl border-2 border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              New partners start pending and invisible. Approve them from their editor to make them
              public.
            </p>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
