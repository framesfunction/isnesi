import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import { getAdminImpactMetric } from "@/features/impact/admin-queries";
import {
  deleteImpactMetricAction,
  toggleImpactMetricPublishAction,
} from "@/features/impact/actions";
import { formatMetricValue } from "@/features/impact/helpers";
import { ImpactMetricForm } from "@/features/impact/impact-metric-form";

export const metadata: Metadata = { title: "Edit impact metric" };

export const dynamic = "force-dynamic";

export default async function AdminImpactMetricDetailPage({
  params,
}: {
  params: Promise<{ metricId: string }>;
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

  const { metricId } = await params;
  const metric = await getAdminImpactMetric(metricId);
  if (!metric) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/admin/impact-metrics"
          className="text-sm font-bold text-brand hover:underline"
        >
          ← Back to impact metrics
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Impact metrics"
        title={metric.label}
        description={`Key: ${metric.key}`}
        actions={
          metric.isPublished ? (
            <Badge variant="success">Published</Badge>
          ) : (
            <Badge variant="outline">Draft</Badge>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <ActionButton
          action={toggleImpactMetricPublishAction}
          hidden={{
            metricId: metric.id,
            isPublished: String(!metric.isPublished),
          }}
          label={metric.isPublished ? "Unpublish" : "Publish"}
          variant={metric.isPublished ? "ghost" : "default"}
        />
      </div>

      <Card className="border border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Edit metric
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImpactMetricForm metric={metric} />
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        <span>
          Display value{" "}
          {formatMetricValue(metric.value, metric.unit, metric.currency)}
        </span>
        <span>Last updated {formatDateTime(metric.updatedAt)}</span>
        <Link href="/impact" className="font-bold text-brand hover:underline">
          View public page
        </Link>
      </div>

      <Card className="mt-6 border border-coral/40">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Delete metric
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Unpublishing hides a figure immediately; approval is removed at the
            same time. Deleting is permanent.
          </p>
          <div className="mt-3">
            <ActionButton
              action={deleteImpactMetricAction}
              hidden={{ metricId: metric.id }}
              label="Delete metric"
              variant="danger"
              confirm="Delete this impact metric permanently? This cannot be undone."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
