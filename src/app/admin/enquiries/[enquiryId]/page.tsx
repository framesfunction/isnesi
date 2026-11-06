import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import {
  getAdminEnquiry,
  listAssignableStaff,
} from "@/features/enquiries/admin-queries";
import {
  addEnquiryNoteAction,
  assignEnquiryAction,
  recordEnquiryMessageAction,
  updateEnquiryStatusAction,
} from "@/features/enquiries/actions";
import { ENQUIRY_STATUSES } from "@/lib/validation/engagement";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Enquiry" };

export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

export default async function AdminEnquiryDetailPage({
  params,
}: {
  params: Promise<{ enquiryId: string }>;
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

  const { enquiryId } = await params;
  const enquiry = await getAdminEnquiry(enquiryId);
  if (!enquiry) notFound();

  const staff = await listAssignableStaff();

  return (
    <div className="mx-auto max-w-5xl">
      <AdminPageHeader
        eyebrow="Engagement / Enquiries"
        title={enquiry.fullName}
        description={`${enquiry.referenceCode} - ${enquiry.enquiryType}`}
        actions={<Badge variant="neutral">{enquiry.status}</Badge>}
      />

      <p className="mb-6 text-xs text-ink-muted">
        <Link
          href="/admin/enquiries"
          className="font-bold text-brand hover:underline"
        >
          Back to enquiries
        </Link>
        {" - "}Received {formatDateTime(enquiry.createdAt)} - Updated{" "}
        {formatDateTime(enquiry.updatedAt)}
        {enquiry.closedAt
          ? ` - Closed ${formatDateTime(enquiry.closedAt)}`
          : ""}
        {" - "}Consent to contact:{" "}
        {enquiry.consentToContact ? "given" : "not given"}
      </p>

      <div className="space-y-8">
        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Original message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-bold text-ink">Email:</span>{" "}
                <span className="text-ink-muted">{enquiry.email ?? "-"}</span>
              </p>
              <p>
                <span className="font-bold text-ink">Phone:</span>{" "}
                <span className="text-ink-muted">{enquiry.phone ?? "-"}</span>
              </p>
              <p>
                <span className="font-bold text-ink">Source:</span>{" "}
                <span className="text-ink-muted">{enquiry.source}</span>
              </p>
              <p className="whitespace-pre-wrap rounded-xl bg-cream p-4 text-ink">
                {enquiry.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-brand/30">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <ActionForm action={assignEnquiryAction} submitLabel="Assign">
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <label className={FIELD_LABELS}>
                  <span>Assign to</span>
                  <select
                    name="assigneeId"
                    required
                    defaultValue=""
                    className={INPUT_CLASS}
                  >
                    <option value="" disabled>
                      Choose a staff member
                    </option>
                    {(staff ?? []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.displayName ?? member.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${FIELD_LABELS} mt-3`}>
                  <span>Reason (optional)</span>
                  <input type="text" name="reason" className={INPUT_CLASS} />
                </label>
              </ActionForm>

              <ActionForm
                action={updateEnquiryStatusAction}
                submitLabel="Update status"
              >
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <label className={FIELD_LABELS}>
                  <span>Status</span>
                  <select
                    name="status"
                    defaultValue={enquiry.status}
                    className={INPUT_CLASS}
                  >
                    {ENQUIRY_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </ActionForm>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ActionButton
                action={updateEnquiryStatusAction}
                hidden={{ enquiryId: enquiry.id, status: "closed" }}
                label="Close"
              />
              <ActionButton
                action={updateEnquiryStatusAction}
                hidden={{ enquiryId: enquiry.id, status: "in_progress" }}
                label="Reopen"
              />
            </div>

            {enquiry.assignments.length > 0 ? (
              <div className="mt-6 border-t border-line pt-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                  Assignment history
                </p>
                <ul className="space-y-1.5 text-xs text-ink-muted">
                  {enquiry.assignments.map((assignment) => (
                    <li key={assignment.id}>
                      <span className="font-mono text-[10px]">
                        {assignment.assignedFrom ?? "unassigned"} →{" "}
                        {assignment.assignedTo}
                      </span>{" "}
                      - {formatDateTime(assignment.assignedAt)}
                      {assignment.reason ? ` - ${assignment.reason}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Response history
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enquiry.messages.length === 0 ? (
              <EmptyState
                title="No responses recorded yet."
                description="Record outbound replies and inbound contact so the history stays complete."
              />
            ) : (
              <ul className="space-y-3">
                {enquiry.messages.map((message) => (
                  <li
                    key={message.id}
                    className="rounded-xl border border-line bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant={
                          message.direction === "outbound"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {message.direction}
                      </Badge>
                      <span className="text-ink-muted">{message.channel}</span>
                      <span className="text-ink-muted">
                        {message.deliveryStatus}
                      </span>
                      <span className="text-ink-muted">
                        {formatDateTime(message.sentAt)}
                      </span>
                    </div>
                    {message.body ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                        {message.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 border-t border-line pt-4">
              <ActionForm
                action={recordEnquiryMessageAction}
                submitLabel="Record message"
              >
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={FIELD_LABELS}>
                    <span>Direction</span>
                    <select
                      name="direction"
                      defaultValue="outbound"
                      className={INPUT_CLASS}
                    >
                      <option value="outbound">outbound (from us)</option>
                      <option value="inbound">inbound (from them)</option>
                    </select>
                  </label>
                  <label className={FIELD_LABELS}>
                    <span>Channel</span>
                    <select
                      name="channel"
                      defaultValue="email"
                      className={INPUT_CLASS}
                    >
                      <option value="email">email</option>
                      <option value="phone">phone</option>
                      <option value="post">post</option>
                      <option value="in_person">in person</option>
                    </select>
                  </label>
                </div>
                <label className={`${FIELD_LABELS} mt-3`}>
                  <span>Message</span>
                  <textarea
                    name="body"
                    rows={4}
                    required
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                  />
                </label>
              </ActionForm>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Internal notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enquiry.notes.length === 0 ? (
              <EmptyState title="No notes yet." />
            ) : (
              <ul className="space-y-3">
                {enquiry.notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-xl bg-cream p-3 text-sm text-ink"
                  >
                    <p className="whitespace-pre-wrap">{note.note}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatDateTime(note.createdAt)} -{" "}
                      {note.authorId ?? "unknown author"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 border-t border-line pt-4">
              <ActionForm action={addEnquiryNoteAction} submitLabel="Add note">
                <input type="hidden" name="enquiryId" value={enquiry.id} />
                <label className={FIELD_LABELS}>
                  <span>Note (internal only)</span>
                  <textarea
                    name="note"
                    rows={3}
                    required
                    className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink"
                  />
                </label>
              </ActionForm>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
