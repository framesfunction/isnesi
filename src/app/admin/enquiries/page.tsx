import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import {
  listAdminEnquiries,
  type AdminEnquiryListItem,
} from "@/features/enquiries/admin-queries";
import { ENQUIRY_STATUSES } from "@/lib/validation/engagement";
import { ENQUIRY_TYPES } from "@/lib/validation/enquiry";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiries" };

export const dynamic = "force-dynamic";

function Row({ enquiry }: { enquiry: AdminEnquiryListItem }) {
  return (
    <tr className="border-t border-line/70">
      <td className="px-3 py-3 align-top">
        <p className="font-bold text-ink">{enquiry.fullName}</p>
        <p className="font-mono text-xs text-ink-muted">
          {enquiry.referenceCode}
        </p>
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {enquiry.enquiryType}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {enquiry.status}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {enquiry.assignedTo ? "Assigned" : "Unassigned"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {formatDateTime(enquiry.createdAt)}
      </td>
      <td className="px-3 py-3 text-right align-top">
        <Link
          href={`/admin/enquiries/${enquiry.id}`}
          className="font-bold text-brand hover:underline"
        >
          Open
        </Link>
      </td>
    </tr>
  );
}

export default async function AdminEnquiriesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const { allowed } = await requirePermission(
    "enquiries.manage",
    "/admin/enquiries",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the enquiries.manage permission."
      />
    );
  }

  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const status = (params.status ?? "").trim();
  const type = (params.type ?? "").trim();
  const enquiries = await listAdminEnquiries(search, status, type);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Engagement"
        title="Enquiries"
        description="General enquiries from the website: assignment, notes, response history and closure. Child safeguarding referrals live in the separate restricted system."
      />

      <div className="mb-6">
        <ListToolbar
          action="/admin/enquiries"
          filters={[
            {
              type: "search",
              name: "q",
              label: "Search name or reference",
              value: search,
            },
            {
              type: "select",
              name: "status",
              label: "Status",
              value: status,
              options: [
                { value: "", label: "All statuses" },
                ...ENQUIRY_STATUSES.map((value) => ({ value, label: value })),
              ],
            },
            {
              type: "select",
              name: "type",
              label: "Type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...ENQUIRY_TYPES.map((value) => ({ value, label: value })),
              ],
            },
          ]}
          submitLabel="Apply"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Enquiries ({enquiries?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enquiries === null ? (
            <p className="text-sm text-ink-muted">
              The database is not connected, so the enquiry list could not be
              loaded.
            </p>
          ) : enquiries.length === 0 ? (
            <EmptyState
              title="No enquiries match."
              description="New website submissions appear here automatically."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Assignment</th>
                    <th className="px-3 py-2">Received</th>
                    <th className="px-3 py-2 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <Row key={enquiry.id} enquiry={enquiry} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
