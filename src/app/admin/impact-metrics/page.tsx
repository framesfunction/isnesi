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
import { listAdminImpactMetrics } from "@/features/impact/admin-queries";
import { formatMetricValue } from "@/features/impact/helpers";
import { ImpactMetricForm } from "@/features/impact/impact-metric-form";
export const metadata: Metadata = { title: "Impact metrics" };
export const dynamic = "force-dynamic";
const COLUMNS: DataTableColumn[] = [
  { key: "metric", label: "Metric" },
  { key: "value", label: "Value" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "updated", label: "Updated" },
  { key: "actions", label: "Actions", align: "right", srOnly: true },
];
export default async function AdminImpactMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { allowed } = await requirePermission(
    "pages.manage",
    "/admin/impact-metrics",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the pages.manage permission."
      />
    );
  }
  const { q } = await searchParams;
  const search = (q ?? "").trim().slice(0, 120);
  const metrics = await listAdminImpactMetrics(search);
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Website"
        title="Impact metrics"
        description="Approve and publish the figures shown on the public Impact page. A metric that is not published and approved is never visible to visitors."
      />{" "}
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/impact-metrics"
          filters={[
            {
              type: "search",
              name: "q",
              label: "Search metrics",
              placeholder: "key or label",
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
            New metric{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <ImpactMetricForm />{" "}
        </CardContent>{" "}
      </Card>{" "}
      {metrics === null ? (
        <Card className="border border-coral/40">
          {" "}
          <CardContent className="p-6 text-sm text-ink-muted">
            {" "}
            The database is not connected, so metrics cannot be loaded.
            Configure Supabase and reload.{" "}
          </CardContent>{" "}
        </Card>
      ) : metrics.length === 0 ? (
        <EmptyState
          title="No impact metrics yet."
          description="Until an approved metric is published, the public Impact page reports live counts of published records instead."
        />
      ) : (
        <Card className="border border-line">
          {" "}
          <CardContent>
            {" "}
            <DataTable
              columns={COLUMNS}
              caption="Impact metrics"
              isEmpty={false}
            >
              {" "}
              {metrics.map((metric) => (
                <tr key={metric.id} className="border-t border-line/70">
                  {" "}
                  <td className="px-3 py-3 align-top">
                    {" "}
                    <p className="font-bold text-ink">{metric.label}</p>{" "}
                    <p className="font-mono text-xs text-ink-muted">
                      {metric.key}
                    </p>{" "}
                  </td>{" "}
                  <td className="px-3 py-3 align-top text-sm font-bold text-brand">
                    {" "}
                    {formatMetricValue(
                      metric.value,
                      metric.unit,
                      metric.currency,
                    )}{" "}
                  </td>{" "}
                  <td className="px-3 py-3 align-top text-xs text-ink-muted">
                    {" "}
                    {metric.sourceNote ?? "—"}{" "}
                  </td>{" "}
                  <td className="px-3 py-3 align-top">
                    {" "}
                    {metric.isPublished ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}{" "}
                  </td>{" "}
                  <td className="px-3 py-3 align-top text-xs text-ink-muted">
                    {" "}
                    {formatDate(metric.updatedAt)}{" "}
                  </td>{" "}
                  <td className="px-3 py-3 text-right align-top">
                    {" "}
                    <Link
                      href={`/admin/impact-metrics/${metric.id}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {" "}
                      Edit{" "}
                    </Link>{" "}
                  </td>{" "}
                </tr>
              ))}{" "}
            </DataTable>{" "}
          </CardContent>{" "}
        </Card>
      )}{" "}
    </div>
  );
}
