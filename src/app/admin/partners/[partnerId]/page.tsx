import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge, APPROVAL_LABELS } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getAdminPartner } from "@/features/partners/admin-queries";
import {
  deletePartnerAction,
  partnerDecisionAction,
  savePartnerAction,
  togglePartnerVisibilityAction,
} from "@/features/partners/actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit partner" };

export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

export default async function AdminPartnerEditorPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { allowed } = await requirePermission(
    "partners.manage",
    "/admin/partners",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the partners.manage permission."
      />
    );
  }

  const { partnerId } = await params;
  const partner = await getAdminPartner(partnerId);
  if (!partner) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        eyebrow="Website / Partners"
        title={partner.name}
        description={partner.websiteUrl ?? undefined}
        actions={
          <StatusBadge
            status={partner.approvalStatus}
            labels={APPROVAL_LABELS}
          />
        }
      />

      <p className="mb-6 text-xs text-ink-muted">
        <Link
          href="/admin/partners"
          className="font-bold text-brand hover:underline"
        >
          Back to partners
        </Link>
        {" - "}Updated {formatDate(partner.updatedAt)}
        {partner.approvedAt
          ? ` - Approved ${formatDate(partner.approvedAt)}`
          : ""}
      </p>

      <div className="space-y-8">
        <Card className="border border-brand/30">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Approval & visibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton
                action={partnerDecisionAction}
                hidden={{
                  partnerId: partner.id,
                  decision: "approve",
                  publicVisible: true,
                }}
                label="Approve + show publicly"
                variant="default"
              />
              <ActionButton
                action={partnerDecisionAction}
                hidden={{
                  partnerId: partner.id,
                  decision: "approve",
                  publicVisible: false,
                }}
                label="Approve (stay hidden)"
              />
              <ActionButton
                action={partnerDecisionAction}
                hidden={{ partnerId: partner.id, decision: "reject" }}
                label="Reject"
                variant="danger"
                confirm="Reject this partner? They will be hidden from the public site."
              />
              <ActionButton
                action={togglePartnerVisibilityAction}
                hidden={{
                  partnerId: partner.id,
                  publicVisible: !partner.publicVisible,
                }}
                label={
                  partner.publicVisible ? "Hide from public" : "Show publicly"
                }
                disabled={partner.approvalStatus !== "approved"}
              />
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Public visibility requires approval first; the public site only
              lists approved and visible partners.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Partner details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={savePartnerAction} submitLabel="Save partner">
              <input type="hidden" name="partnerId" value={partner.id} />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={FIELD_LABELS}>
                  <span>Name</span>
                  <input
                    type="text"
                    name="name"
                    defaultValue={partner.name}
                    required
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Relationship type</span>
                  <input
                    type="text"
                    name="relationshipType"
                    defaultValue={partner.relationshipType ?? ""}
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
                    defaultValue={partner.websiteUrl ?? ""}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={FIELD_LABELS}>
                  <span>Logo media ID (optional)</span>
                  <input
                    type="text"
                    name="logoMediaId"
                    defaultValue={partner.logoMediaId ?? ""}
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
                    defaultValue={partner.description ?? ""}
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                  />
                </label>
              </div>
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
              action={deletePartnerAction}
              hidden={{ partnerId: partner.id }}
              label="Delete partner"
              variant="danger"
              confirm={`Delete ${partner.name}? This cannot be undone.`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
