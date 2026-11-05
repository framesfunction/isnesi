import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  listAdminAuditEvents,
  listAdminAuditActions,
  listAdminAuditTables,
  type AdminAuditEvent,
} from "@/features/audit/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

type PageSearchParams = {
  action?: string;
  table?: string;
  actor?: string;
  from?: string;
  to?: string;
  q?: string;
};

function Row({ event }: { event: AdminAuditEvent }) {
  const oldJson = event.oldData ? JSON.stringify(event.oldData).slice(0, 120) : "—";
  const newJson = event.newData ? JSON.stringify(event.newData).slice(0, 120) : "—";
  return (
    <tr key={event.id} className="border-t border-line/70">
      <td className="px-3 py-3 align-top text-[11px] font-mono text-ink-muted">
        {formatDateTime(event.createdAt)}
      </td>
      <td className="px-3 py-3 align-top text-sm font-bold text-ink">
        {event.action}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {event.tableName}
      </td>
      <td className="px-3 py-3 align-top text-xs font-mono text-ink-muted">
        {event.recordId ?? "—"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {event.actorId ?? "system"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {oldJson}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {newJson}
      </td>
    </tr>
  );
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { allowed } = await requirePermission("audit.read", "/admin/audit");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the audit.read permission."
      />
    );
  }

  const params = await searchParams;
  const action = (params.action ?? "").trim();
  const table = (params.table ?? "").trim();
  const actor = (params.actor ?? "").trim();
  const from = (params.from ?? "").trim();
  const to = (params.to ?? "").trim();
  const q = (params.q ?? "").trim();

  const [events, actions, tables] = await Promise.all([
    listAdminAuditEvents({ action: action || undefined, actor: actor || undefined, table: table || undefined, from: from || undefined, to: to || undefined }),
    listAdminAuditActions(),
    listAdminAuditTables(),
  ]);

  if (events === null) {
    return (
      <Card className="border-2 border-coral/40">
        <CardContent className="p-6 text-sm text-ink-muted">
          The database is not connected, so the audit log could not be loaded.
        </CardContent>
      </Card>
    );
  }

  const filtered = q
    ? events.filter((e) =>
        `${e.action} ${e.tableName} ${e.recordId ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      )
    : events;

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Operations"
        title="Audit log"
        description="Append-only record of who changed what, when, and how. Read-only; entries are never edited or deleted."
      />

      <div className="mb-6">
        <form action="/admin/audit" method="get" className="grid gap-3 sm:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auditAction">Action</Label>
            <Select name="action" defaultValue={action} className={INPUT_CLASS}>
              <option value="">All actions</option>
              {actions?.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auditTable">Table</Label>
            <Select name="table" defaultValue={table} className={INPUT_CLASS}>
              <option value="">All tables</option>
              {tables?.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auditActor">Actor ID</Label>
            <input
              id="auditActor"
              name="actor"
              defaultValue={actor}
              placeholder="User UUID"
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auditFrom">From</Label>
            <input
              id="auditFrom"
              name="from"
              type="datetime-local"
              defaultValue={from}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auditTo">To</Label>
            <input
              id="auditTo"
              name="to"
              type="datetime-local"
              defaultValue={to}
              className={INPUT_CLASS}
            />
          </div>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      </div>

      <Card className="mb-8 border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Events ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: "time", label: "Time" },
              { key: "action", label: "Action" },
              { key: "table", label: "Table" },
              { key: "record", label: "Record" },
              { key: "actor", label: "Actor" },
              { key: "oldData", label: "Before" },
              { key: "newData", label: "After" },
            ]}
            isEmpty={filtered.length === 0}
            empty={
              <EmptyState
                title="No audit events found."
                description={action || table || actor || from || to || q ? "Try a different filter." : "No records yet."}
              />
            }
          >
            {filtered.map((event) => (
              <Row key={event.id} event={event} />
            ))}
          </DataTable>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Link href="/admin">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
