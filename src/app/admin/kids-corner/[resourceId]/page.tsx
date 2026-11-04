import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  reviewKidsResourceAction,
  saveKidsResourceAction,
} from "@/features/kids/actions";
import { getAdminKidsResource } from "@/features/kids/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
import { KIDS_RESOURCE_TYPES } from "@/lib/validation/kids";

export const metadata: Metadata = { title: "Edit kids resource" };
export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

const TYPE_LABELS: Record<string, string> = {
  story: "Story",
  activity: "Activity",
  game: "Game",
  video: "Video",
  download: "Download",
};

type PageParams = {
  resourceId: string;
};

/* Plain form action (single FormData argument) */

async function handleReviewKidsResource(formData: FormData): Promise<void> {
  "use server";
  await reviewKidsResourceAction(undefined, formData);
}

export default async function AdminKidsResourceDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { allowed } = await requirePermission("kids.manage", "/admin/kids-corner");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the kids.manage permission."
      />
    );
  }

  const { resourceId } = await params;

  const resource = await getAdminKidsResource(resourceId);

  if (resource === null) {
    return (
      <Card className="border-2 border-coral/40">
        <CardContent className="p-6 text-sm text-ink-muted">
          The database is not connected, so this resource could not be loaded.
        </CardContent>
      </Card>
    );
  }

  if (!resource) {
    return (
      <EmptyState title="Resource not found." description="This kids resource does not exist." />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        eyebrow="Engagement"
        title="Edit kids resource"
        description={`Review and update ${resource.titleEn ?? "(untitled)"}.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-2 border-line rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Status</p>
          <p className="mt-1 text-sm font-bold text-ink">
            <StatusBadge status={resource.status} labels={STATUS_LABELS} />
          </p>
        </Card>
        <Card className="border-2 border-line rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Safeguarding</p>
          <p className={`mt-1 text-sm font-bold ${resource.safeguardingApproved ? "text-leaf" : "text-coral"}`}>
            {resource.safeguardingApproved ? "Cleared" : "Pending"}
          </p>
        </Card>
        <Card className="border-2 border-line rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Featured</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {resource.featured ? "Yes" : "No"}
          </p>
        </Card>
      </div>

      <Card className="mb-8 border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Resource details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={saveKidsResourceAction} submitLabel="Save changes">
            <input type="hidden" name="resourceId" value={resource.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Type</span>
                <select name="resourceType" defaultValue={resource.resourceType} className={INPUT_CLASS}>
                  {KIDS_RESOURCE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {TYPE_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={FIELD_LABELS}>
                <span>English title</span>
                <input
                  type="text"
                  name="titleEn"
                  defaultValue={resource.titleEn ?? ""}
                  required
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>French title</span>
                <input
                  type="text"
                  name="titleFr"
                  defaultValue={resource.titleFr ?? ""}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Minimum age</span>
                <input
                  type="number"
                  name="minAge"
                  defaultValue={resource.minAge?.toString() ?? ""}
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Maximum age</span>
                <input
                  type="number"
                  name="maxAge"
                  defaultValue={resource.maxAge?.toString() ?? ""}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <label className={FIELD_LABELS}>
                <span>English description</span>
                <textarea
                  name="descriptionEn"
                  rows={4}
                  defaultValue={resource.descriptionEn ?? ""}
                  className="rounded-xl border-2 border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>French description</span>
                <textarea
                  name="descriptionFr"
                  rows={3}
                  defaultValue={resource.descriptionFr ?? ""}
                  className="rounded-xl border-2 border-line bg-white px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>
            <div className="mt-4 flex items-start gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={resource.featured}
                  className="form-checkbox"
                />
                Featured on public Kids&apos; Corner
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Changes are saved as draft. Submit for safeguarding review before publishing.
            </p>
          </ActionForm>
        </CardContent>
      </Card>

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Safeguarding review
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {resource.safeguardingApproved ? (
            <div className="p-4 rounded-xl border-2 border-leaf/40 bg-leaf-soft/60">
              <p className="font-medium text-leaf">Safeguarding cleared.</p>
              <p className="text-sm text-leaf/80 mt-1">
                This resource is safeguarding-approved and can be published or featured.
              </p>
            </div>
          ) : (
            <>
              <form action={handleReviewKidsResource} className="grid gap-3 sm:grid-cols-3">
                <input type="hidden" name="resourceId" value={resource.id} />
                <div className="flex flex-col gap-1.5">
                  <Label>Decision</Label>
                  <Select name="decision" defaultValue="approve" className="min-h-10">
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Review note</Label>
                  <input
                    name="note"
                    defaultValue=""
                    className={INPUT_CLASS}
                    placeholder="Reason for the decision"
                  />
                </div>
                <Button type="submit" size="sm">
                  Record decision
                </Button>
              </form>
              <p className="text-xs text-ink-muted mt-4">
                Only safeguarding-approved resources can be published on the public
                Kids&apos; Corner. Rejected resources remain hidden.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Link href="/admin/kids-corner">
          <Button variant="outline">Back to list</Button>
        </Link>
      </div>
    </div>
  );
}
