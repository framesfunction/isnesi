"use client";
import { useActionState } from "react";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  createDonationCampaignAction,
  toggleDonationCampaignAction,
  deleteDonationCampaignAction,
} from "@/features/finance/actions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  created: "Created",
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};
const REFUND_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  succeeded: "Succeeded",
  failed: "Failed",
};
const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_review: "In review",
  reconciled: "Reconciled",
  disputed: "Disputed",
};
function money(amountMinor: number, currency: string): string {
  return formatCurrency(amountMinor, currency);
}
function CampaignToggleForm({
  campaignId,
  isActive,
}: {
  campaignId: string;
  isActive: boolean;
}) {
  const [, formAction, pending] = useActionState(
    toggleDonationCampaignAction,
    undefined,
  );
  return (
    <form action={formAction} className="inline">
      {" "}
      <input type="hidden" name="campaignId" value={campaignId} />{" "}
      <input type="hidden" name="isActive" value={String(!isActive)} />{" "}
      <Button
        type="submit"
        disabled={pending}
        size="sm"
        variant={isActive ? "destructive" : "default"}
      >
        {" "}
        {isActive ? "Deactivate" : "Activate"}{" "}
      </Button>{" "}
    </form>
  );
}
function CampaignDeleteForm({ campaignId }: { campaignId: string }) {
  const [, formAction, pending] = useActionState(
    deleteDonationCampaignAction,
    undefined,
  );
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Delete this campaign? This cannot be undone if it has no donations.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      {" "}
      <input type="hidden" name="campaignId" value={campaignId} />{" "}
      <Button type="submit" disabled={pending} size="sm" variant="outline">
        {" "}
        Delete{" "}
      </Button>{" "}
    </form>
  );
}
type Campaign = {
  id: string;
  key: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  donation_campaign_translations: Array<{
    title: string;
    description: string;
    locale: string;
  }>;
};
function CampaignRow({ campaign }: { campaign: Campaign }) {
  const translation = campaign.donation_campaign_translations?.[0];
  const title = translation?.title ?? campaign.key;
  return (
    <tr key={campaign.id} className="border-t border-line">
      {" "}
      <td className="p-3 font-mono text-sm">{campaign.key}</td>{" "}
      <td className="p-3 text-sm">{title}</td>{" "}
      <td className="p-3 text-sm text-ink-muted">
        {" "}
        {campaign.starts_at ? formatDate(campaign.starts_at) : "—"}{" "}
      </td>{" "}
      <td className="p-3 text-sm text-ink-muted">
        {" "}
        {campaign.ends_at ? formatDate(campaign.ends_at) : "—"}{" "}
      </td>{" "}
      <td className="p-3">
        {" "}
        <StatusBadge status={campaign.is_active ? "active" : "inactive"} />{" "}
      </td>{" "}
      <td className="p-3 flex gap-2">
        {" "}
        <CampaignToggleForm
          campaignId={campaign.id}
          isActive={campaign.is_active}
        />{" "}
        <CampaignDeleteForm campaignId={campaign.id} />{" "}
      </td>{" "}
    </tr>
  );
}
type Donation = {
  id: string;
  public_reference: string;
  donor_name: string | null;
  donor_email: string | null;
  amount_minor: number;
  currency: string;
  payment_status: string;
  provider_key: string | null;
  provider_transaction_id: string | null;
  receipt_number: string | null;
  paid_at: string | null;
  created_at: string;
  campaign_id: string | null;
  is_anonymous: boolean;
};
type FormAction = (formData: FormData) => void | Promise<void>;
function DonationRow({
  donation,
  onCreateIntent,
}: {
  donation: Donation;
  onCreateIntent: FormAction;
}) {
  return (
    <tr key={donation.id} className="border-t border-line">
      {" "}
      <td className="p-3 font-mono text-sm">
        {donation.public_reference}
      </td>{" "}
      <td className="p-3 text-sm">
        {" "}
        {donation.donor_name ??
          (donation.is_anonymous ? "Anonymous" : "—")}{" "}
      </td>{" "}
      <td className="p-3 text-sm text-right font-bold">
        {" "}
        {money(donation.amount_minor, donation.currency)}{" "}
      </td>{" "}
      <td className="p-3">
        {" "}
        <StatusBadge
          status={donation.payment_status}
          labels={PAYMENT_STATUS_LABELS}
        />{" "}
      </td>{" "}
      <td className="p-3 text-sm">
        {" "}
        {donation.receipt_number ? (
          <span className="font-mono">{donation.receipt_number}</span>
        ) : (
          <span className="text-ink-muted">—</span>
        )}{" "}
      </td>{" "}
      <td className="p-3 text-sm text-ink-muted">
        {" "}
        {donation.paid_at ? formatDateTime(donation.paid_at) : "—"}{" "}
      </td>{" "}
      <td className="p-3 text-right">
        {" "}
        {donation.payment_status === "succeeded" && donation.receipt_number ? (
          <Button type="button" size="sm" variant="outline">
            {" "}
            Receipt{" "}
          </Button>
        ) : donation.payment_status === "created" ? (
          <form action={onCreateIntent} className="inline">
            {" "}
            <input type="hidden" name="donationId" value={donation.id} />{" "}
            <input
              type="hidden"
              name="amountMinor"
              value={String(donation.amount_minor)}
            />{" "}
            <input type="hidden" name="currency" value={donation.currency} />{" "}
            <input
              type="text"
              name="payerPhone"
              required
              placeholder="Payer phone, e.g. +237 6XX XXX XXX"
              aria-label={`Payer phone for ${donation.public_reference}`}
              className="mr-2 min-h-8 w-52 rounded-lg border border-line bg-white px-2 text-xs text-ink"
            />{" "}
            <Button type="submit" size="sm" variant="secondary">
              {" "}
              Pay now{" "}
            </Button>{" "}
          </form>
        ) : (
          <span className="text-ink-muted text-xs">—</span>
        )}{" "}
      </td>{" "}
    </tr>
  );
}
type Refund = {
  id: string;
  donation_id: string;
  amount_minor: number;
  reason: string | null;
  status: string;
  created_at: string;
  donations: { public_reference: string; amount_minor: number; currency: string };
};
function RefundRow({
  refund,
  onApprove,
}: {
  refund: Refund;
  onApprove: FormAction;
}) {
  return (
    <tr key={refund.id} className="border-t border-line">
      {" "}
      <td className="p-3 font-mono text-sm">
        {refund.donations.public_reference}
      </td>{" "}
      <td className="p-3 text-sm text-right font-bold">
        {" "}
        {money(refund.amount_minor, refund.donations.currency)}{" "}
      </td>{" "}
      <td className="p-3 text-sm">{refund.reason ?? "—"}</td>{" "}
      <td className="p-3">
        {" "}
        <StatusBadge
          status={refund.status}
          labels={REFUND_STATUS_LABELS}
        />{" "}
      </td>{" "}
      <td className="p-3 text-sm text-ink-muted">
        {formatDateTime(refund.created_at)}
      </td>{" "}
      <td className="p-3 text-right">
        {" "}
        {refund.status === "requested" ? (
          <form action={onApprove} className="inline">
            {" "}
            <input type="hidden" name="refundId" value={refund.id} />{" "}
            <Button type="submit" size="sm" variant="default">
              {" "}
              Approve{" "}
            </Button>{" "}
          </form>
        ) : (
          <span className="text-ink-muted text-xs">
            {" "}
            {refund.status === "succeeded" ? "Approved" : "Failed"}{" "}
          </span>
        )}{" "}
      </td>{" "}
    </tr>
  );
}
type Reconciliation = {
  id: string;
  period_start: string;
  period_end: string;
  provider_key: string | null;
  statement_reference: string | null;
  total_minor: number;
  currency: string;
  status: string;
  created_at: string;
};
function ReconciliationRow({ rec }: { rec: Reconciliation }) {
  return (
    <tr key={rec.id} className="border-t border-line">
      {" "}
      <td className="p-3 text-sm font-mono">
        {" "}
        {formatDate(rec.period_start)} to {formatDate(rec.period_end)}{" "}
      </td>{" "}
      <td className="p-3 text-sm text-right font-bold">
        {" "}
        {money(rec.total_minor, rec.currency)}{" "}
      </td>{" "}
      <td className="p-3 text-sm">{rec.provider_key ?? "—"}</td>{" "}
      <td className="p-3">
        {" "}
        <StatusBadge
          status={rec.status}
          labels={RECONCILIATION_STATUS_LABELS}
        />{" "}
      </td>{" "}
      <td className="p-3 text-sm text-ink-muted">
        {formatDateTime(rec.created_at)}
      </td>{" "}
    </tr>
  );
}
function CampaignManager({ campaigns }: { campaigns: Campaign[] }) {
  const [state, formAction, pending] = useActionState(
    createDonationCampaignAction,
    undefined,
  );
  return (
    <div className="border border-line rounded-xl">
      {" "}
      <div className="p-4 border-b border-line">
        {" "}
        <h2 className="font-display text-base font-extrabold text-brand">
          Campaign manager
        </h2>{" "}
        <p className="mt-0.5 text-sm text-ink-muted">
          {" "}
          Create donation campaigns and activate or deactivate them. Inactive
          campaigns do not appear on public donation forms.{" "}
        </p>{" "}
      </div>{" "}
      <div className="p-4">
        {" "}
        {state?.message ? (
          <p
            role="status"
            aria-live="polite"
            className={
              state.status === "success"
                ? "mb-4 flex items-start gap-2 rounded-2xl border border-leaf/40 bg-leaf-soft/60 p-3 text-sm font-bold text-leaf-strong"
                : "mb-4 flex items-start gap-2 rounded-2xl border border-coral/40 bg-white p-3 text-sm font-bold text-coral-strong"
            }
          >
            {" "}
            {state.status === "success" ? (
              <>✓ {state.message}</>
            ) : (
              <>
                {" "}
                ⚠ {state.message}{" "}
                {state.fieldErrors &&
                Object.keys(state.fieldErrors).length > 0 ? (
                  <span className="mt-1 block list-inside list-disc font-normal text-ink-muted">
                    {" "}
                    {Object.entries(state.fieldErrors).map(
                      ([field, message]) => (
                        <span key={field} className="block">
                          {" "}
                          {field}: {message}{" "}
                        </span>
                      ),
                    )}{" "}
                  </span>
                ) : null}{" "}
              </>
            )}{" "}
          </p>
        ) : null}{" "}
        <form action={formAction} className="grid gap-4 sm:grid-cols-4">
          {" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Campaign key{" "}
            </label>{" "}
            <input
              name="key"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Title{" "}
            </label>{" "}
            <input
              name="title"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Description{" "}
            </label>{" "}
            <input
              name="description"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex items-end">
            {" "}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              {" "}
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="form-checkbox"
              />{" "}
              Active{" "}
            </label>{" "}
          </div>{" "}
          <Button type="submit" disabled={pending} size="sm">
            {" "}
            {pending ? "Creating…" : "Create campaign"}{" "}
          </Button>{" "}
        </form>{" "}
        <p className="mt-3 text-xs text-ink-muted">
          {" "}
          Keys use lowercase letters, numbers and single hyphens (e.g.
          `emergency-appeal-2026`).{" "}
        </p>{" "}
      </div>{" "}
      <div className="overflow-x-auto p-4 border-t border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="p-3 font-bold">Key</th>
              <th className="p-3 font-bold">Title</th>
              <th className="p-3 font-bold">Starts</th>
              <th className="p-3 font-bold">Ends</th>
              <th className="p-3 font-bold">Status</th>
              <th className="p-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink-muted">
                  <EmptyState
                    title="No campaigns yet."
                    description="Create your first campaign above."
                  />
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <CampaignRow key={campaign.id} campaign={campaign} />
              ))
            )}
          </tbody>
        </table>
      </div>{" "}
    </div>
  );
}
export {
  CampaignManager,
  CampaignToggleForm,
  CampaignDeleteForm,
  CampaignRow,
  DonationRow,
  RefundRow,
  ReconciliationRow,
  money,
  PAYMENT_STATUS_LABELS,
  REFUND_STATUS_LABELS,
  RECONCILIATION_STATUS_LABELS,
};
export type { Campaign, Donation, Refund, Reconciliation, FormAction };
