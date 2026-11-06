import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { listAdminProgrammes } from "@/features/programmes/admin-queries";
import { ProgrammeForm } from "@/features/programmes/programme-form";
export const metadata: Metadata = { title: "Programmes" };
export const dynamic = "force-dynamic";
const COLUMNS: DataTableColumn[] = [
  { key: "programme", label: "Programme" },
  { key: "translations", label: "Translations" },
  { key: "order", label: "Order", align: "center" },
  { key: "status", label: "Status" },
  { key: "updated", label: "Updated" },
  { key: "actions", label: "Actions", align: "right", srOnly: true },
];
export default async function AdminProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { allowed } = await requirePermission(
    "programmes.manage",
    "/admin/programmes",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the programmes.manage permission."
      />
    );
  }
  const { q } = await searchParams;
  const search = (q ?? "").trim().slice(0, 120);
  const programmes = await listAdminProgrammes(search);
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Website"
        title="Programmes"
        description="Maintain the programme areas shown on the public website in English, and control their order and visibility."
      />{" "}
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/programmes"
          filters={[
            {
              type: "search",
              name: "q",
              label: "Search programmes",
              placeholder: "key or title",
              value: search,
            },
          ]}
          submitLabel="Search"
        />{" "}
      </div>{" "}
      <Card className="mb-6 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            New programme{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <ProgrammeForm />{" "}
        </CardContent>{" "}
      </Card>{" "}
      {programmes === null ? (
        <Card className="border border-coral/40">
          {" "}
          <CardContent className="p-6 text-sm text-ink-muted">
            {" "}
            The database is not connected, so programmes cannot be loaded.
            Configure Supabase and reload.{" "}
          </CardContent>{" "}
        </Card>
      ) : programmes.length === 0 ? (
        <EmptyState
          title="No programmes yet."
          description="Create the first programme above; active programmes appear on the public site."
        />
      ) : (
        <Card className="border border-line">
          <CardContent>
            <DataTable columns={COLUMNS} caption="Programmes" isEmpty={false}>
              {programmes.map((programme) => (
                <tr key={programme.id} className="border-t border-line/70">
                  <td className="px-3 py-3 align-top">
                    <p className="font-bold text-ink">
                      {programme.icon ? `${programme.icon} ` : ""}
                      {programme.title ?? "(untitled)"}
                    </p>
                    <p className="font-mono text-xs text-ink-muted">
                      {programme.key}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="neutral">EN</Badge>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center align-top text-xs text-ink-muted">
                    {programme.sortOrder}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {programme.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-xs text-ink-muted">
                    {formatDate(programme.updatedAt)}
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <Link
                      href={`/admin/programmes/${programme.id}`}
                      className="font-bold text-brand hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </DataTable>
          </CardContent>{" "}
        </Card>
      )}{" "}
    </div>
  );
}
