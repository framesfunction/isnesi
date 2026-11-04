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
import { getAdminProgramme } from "@/features/programmes/admin-queries";
import {
  deleteProgrammeAction,
  reorderProgrammeAction,
  toggleProgrammeActiveAction,
} from "@/features/programmes/actions";
import { ProgrammeForm } from "@/features/programmes/programme-form";

export const metadata: Metadata = { title: "Edit programme" };

export const dynamic = "force-dynamic";

export default async function AdminProgrammeDetailPage({
  params,
}: {
  params: Promise<{ programmeId: string }>;
}) {
  const { allowed } = await requirePermission("programmes.manage", "/admin/programmes");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the programmes.manage permission."
      />
    );
  }

  const { programmeId } = await params;
  const programme = await getAdminProgramme(programmeId);
  if (!programme) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/admin/programmes" className="text-sm font-bold text-brand hover:underline">
          ← Back to programmes
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Programmes"
        title={programme.en?.title ?? programme.key}
        description={`Key: ${programme.key}`}
        actions={
          programme.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          )
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <ActionButton
          action={toggleProgrammeActiveAction}
          hidden={{ programmeId: programme.id, isActive: !programme.isActive }}
          label={programme.isActive ? "Deactivate" : "Activate"}
          variant="ghost"
        />
        <ActionButton
          action={reorderProgrammeAction}
          hidden={{ programmeId: programme.id, direction: "up" }}
          label="Move up"
          variant="outline"
        />
        <ActionButton
          action={reorderProgrammeAction}
          hidden={{ programmeId: programme.id, direction: "down" }}
          label="Move down"
          variant="outline"
        />
      </div>

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Edit programme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgrammeForm programme={programme} />
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
        <span>Sort order {programme.sortOrder}</span>
        <span>Last updated {formatDateTime(programme.updatedAt)}</span>
        <Link href="/programmes" className="font-bold text-brand hover:underline">
          View public page
        </Link>
      </div>

      <Card className="mt-6 border-2 border-coral/40">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Delete programme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Deactivating hides a programme without losing its translations. Deleting is permanent and
            is blocked while media still references it.
          </p>
          <div className="mt-3">
            <ActionButton
              action={deleteProgrammeAction}
              hidden={{ programmeId: programme.id }}
              label="Delete programme"
              variant="danger"
              confirm="Delete this programme permanently? This cannot be undone."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}