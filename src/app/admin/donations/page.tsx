import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  createDonationIntentAction,
  requestDonationRefundAction,
  saveReconciliationAction,
  approveDonationRefundAction,
} from "@/features/finance/actions";
import {
  getAdminDonationStats,
  listAdminDonationCampaigns,
  listAdminDonations,
  listAdminRefunds,
  listAdminReconciliations,
} from "@/features/finance/admin-queries";
import {
  CampaignManager,
  Campaign,
  DonationRow,
  Donation,
  RefundRow,
  Refund,
  ReconciliationRow,
  Reconciliation,
} from "@/app/admin/donations/components";
import { requirePermission } from "@/lib/auth/guards";
import { formatCurrency, formatNumber } from "@/lib/format";
export const metadata: Metadata = { title: "Donations" };
export const dynamic = "force-dynamic";
function money(amountMinor: number, currency: string): string {
  return formatCurrency(amountMinor, currency);
}
async function getDonationStats() {
  const stats = await getAdminDonationStats();
  if (!stats) return null;
  return {
    totalCount: stats.totalCount,
    totalVolume: money(stats.totalVolume, "XAF"),
    succeededCount: stats.succeededCount,
    succeededVolume: money(stats.succeededVolume, "XAF"),
    failedCount: stats.failedCount,
    failedVolume: money(stats.failedVolume, "XAF"),
    pendingCount: stats.pendingCount,
    refundedCount: stats.refundedCount,
    refundedVolume: money(stats.refundedVolume, "XAF"),
  };
}
async function handleCreateDonationIntent(formData: FormData): Promise<void> {
  "use server";
  await createDonationIntentAction(undefined, formData);
}
async function handleRequestRefund(formData: FormData): Promise<void> {
  "use server";
  await requestDonationRefundAction(undefined, formData);
}
async function handleSaveReconciliation(formData: FormData): Promise<void> {
  "use server";
  await saveReconciliationAction(undefined, formData);
}
async function handleApproveRefund(formData: FormData): Promise<void> {
  "use server";
  await approveDonationRefundAction(undefined, formData);
}
function StatCard({
  title,
  value,
  delta,
  variant = "default",
}: {
  title: string;
  value: string;
  delta?: string;
  variant?: "default" | "success" | "danger" | "warning" | "neutral";
}) {
  return (
    <div className="border border-line rounded-xl p-4">
      {" "}
      <div className="flex flex-row items-center justify-between">
        {" "}
        <div>
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            {title}
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">
            {value}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {delta ? (
        <p
          className={`mt-3 text-xs font-bold ${variant === "success" ? "text-leaf-strong" : variant === "danger" ? "text-coral-strong" : "text-ink-muted"}`}
        >
          {" "}
          {delta}{" "}
        </p>
      ) : null}{" "}
    </div>
  );
}
export default async function AdminDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { allowed } = await requirePermission(
    "donations.read",
    "/admin/donations",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the donations.read permission."
      />
    );
  }
  const { status: statusFilter } = await searchParams;
  const status = (statusFilter ?? "").trim();
  const [donations, campaigns, refunds, reconciliations, statsResult] =
    await Promise.all([
      listAdminDonations(),
      listAdminDonationCampaigns(),
      listAdminRefunds(),
      listAdminReconciliations(),
      getDonationStats(),
    ]);
  if (
    donations === null ||
    campaigns === null ||
    refunds === null ||
    reconciliations === null
  ) {
    return (
      <div className="border border-coral/40 rounded-xl p-6 text-sm text-ink-muted">
        {" "}
        The database is not connected, so finance cannot be loaded. Configure
        Supabase and reload.{" "}
      </div>
    );
  }
  const stats = statsResult;
  const filteredDonations = status
    ? donations.filter((d) => d.payment_status === status)
    : donations;
  const succeededTotal = filteredDonations
    .filter((d) => d.payment_status === "succeeded")
    .reduce((acc, d) => acc + d.amount_minor, 0);
  const pendingTotal = filteredDonations
    .filter(
      (d) => d.payment_status === "created" || d.payment_status === "pending",
    )
    .reduce((acc, d) => acc + d.amount_minor, 0);
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Finance"
        title="Donations"
        description="Verified transactions, refunds and provider settlement reconciliation."
      />{" "}
      {/* Financial summary */}{" "}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
          {" "}
          <StatCard
            title="Total transactions"
            value={formatNumber(stats.totalCount)}
          />{" "}
          <StatCard title="Total volume" value={stats.totalVolume} />{" "}
          <StatCard
            title="Succeeded"
            value={stats.succeededVolume}
            delta={`${stats.succeededCount} paid`}
            variant="success"
          />{" "}
          <StatCard
            title="Failed"
            value={stats.failedVolume}
            delta={`${stats.failedCount} failed`}
            variant="danger"
          />{" "}
          <StatCard
            title="Refunded"
            value={stats.refundedVolume}
            delta={`${stats.refundedCount} refunded`}
            variant="warning"
          />{" "}
        </div>
      )}{" "}
      {/* Campaign manager */}{" "}
      <CampaignManager campaigns={campaigns as unknown as Campaign[]} />{" "}
      {/* Donation transactions */}{" "}
      <div className="mt-6 border border-line rounded-xl">
        {" "}
        <div className="flex flex-row items-center justify-between p-4 border-b border-line">
          {" "}
          <div>
            {" "}
            <h2 className="font-display text-base font-extrabold text-brand">
              Transactions
            </h2>{" "}
            <p className="mt-0.5 text-sm text-ink-muted">
              {" "}
              All donation records. Create a payment intent to send a donor to
              the payment provider.{" "}
            </p>{" "}
          </div>{" "}
          <form
            method="get"
            action="/admin/donations"
            className="flex items-end gap-3"
          >
            {" "}
            <Select
              name="status"
              defaultValue={status}
              className="min-h-10 w-48"
            >
              {" "}
              <option value="">All statuses</option>{" "}
              <option value="created">Created</option>{" "}
              <option value="pending">Pending</option>{" "}
              <option value="succeeded">Succeeded</option>{" "}
              <option value="failed">Failed</option>{" "}
              <option value="cancelled">Cancelled</option>{" "}
              <option value="refunded">Refunded</option>{" "}
              <option value="partially_refunded">
                Partially refunded
              </option>{" "}
            </Select>{" "}
            <Button type="submit" variant="secondary" size="sm">
              {" "}
              Filter{" "}
            </Button>{" "}
          </form>{" "}
        </div>{" "}
        <div className="overflow-x-auto p-4">
          {" "}
          <table className="w-full text-sm">
            {" "}
            <thead>
              {" "}
              <tr className="text-left text-xs text-ink-muted">
                {" "}
                <th className="p-3 font-bold">Reference</th>{" "}
                <th className="p-3 font-bold">Donor</th>{" "}
                <th className="p-3 font-bold text-right">Amount</th>{" "}
                <th className="p-3 font-bold">Status</th>{" "}
                <th className="p-3 font-bold">Receipt</th>{" "}
                <th className="p-3 font-bold">Paid</th>{" "}
                <th className="p-3 font-bold text-right">Actions</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {filteredDonations.length === 0 ? (
                <tr>
                  {" "}
                  <td colSpan={7} className="p-6 text-center text-ink-muted">
                    {" "}
                    <EmptyState
                      title="No donations found."
                      description={
                        status
                          ? "Try a different status filter."
                          : "No donation records yet."
                      }
                    />{" "}
                  </td>{" "}
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <DonationRow
                    key={donation.id}
                    donation={donation as unknown as Donation}
                    onCreateIntent={handleCreateDonationIntent}
                  />
                ))
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
        <div className="mt-4 px-4 pb-4 flex justify-end">
          {" "}
          <p className="text-sm font-bold text-ink">
            {" "}
            Filtered total: {money(succeededTotal, "XAF")} succeeded ·{" "}
            {money(pendingTotal, "XAF")} pending{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Refund manager */}{" "}
      <div className="mt-6 border border-line rounded-xl">
        {" "}
        <div className="p-4 border-b border-line">
          {" "}
          <h2 className="font-display text-base font-extrabold text-brand">
            Refunds
          </h2>{" "}
          <p className="mt-0.5 text-sm text-ink-muted">
            {" "}
            Request refunds for succeeded donations and approve pending
            requests.{" "}
          </p>{" "}
        </div>{" "}
        <form
          action={handleRequestRefund}
          className="p-4 grid gap-4 sm:grid-cols-4"
        >
          {" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Donation ID{" "}
            </label>{" "}
            <input
              name="donationId"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
              placeholder="Donation UUID"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Amount (minor){" "}
            </label>{" "}
            <input
              name="amountMinor"
              type="number"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Reason{" "}
            </label>{" "}
            <input
              name="reason"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <Button type="submit" size="sm">
            {" "}
            Request refund{" "}
          </Button>{" "}
        </form>{" "}
        <p className="px-4 mt-3 text-xs text-ink-muted">
          {" "}
          Only succeeded donations can be refunded, and the amount cannot exceed
          the donation total.{" "}
        </p>{" "}
        <div className="overflow-x-auto p-4">
          {" "}
          <table className="w-full text-sm">
            {" "}
            <thead>
              {" "}
              <tr className="text-left text-xs text-ink-muted">
                {" "}
                <th className="p-3 font-bold">Reference</th>{" "}
                <th className="p-3 font-bold text-right">Amount</th>{" "}
                <th className="p-3 font-bold">Reason</th>{" "}
                <th className="p-3 font-bold">Status</th>{" "}
                <th className="p-3 font-bold">Requested</th>{" "}
                <th className="p-3 font-bold text-right">Actions</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {refunds.length === 0 ? (
                <tr>
                  {" "}
                  <td colSpan={6} className="p-6 text-center text-ink-muted">
                    {" "}
                    <EmptyState title="No refunds yet." />{" "}
                  </td>{" "}
                </tr>
              ) : (
                refunds.map((refund) => (
                  <RefundRow
                    key={refund.id}
                    refund={refund as unknown as Refund}
                    onApprove={handleApproveRefund}
                  />
                ))
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      {/* Reconciliation manager */}{" "}
      <div className="mt-6 border border-line rounded-xl">
        {" "}
        <div className="p-4 border-b border-line">
          {" "}
          <h2 className="font-display text-base font-extrabold text-brand">
            Reconciliation
          </h2>{" "}
          <p className="mt-0.5 text-sm text-ink-muted">
            {" "}
            Record provider settlement periods and match them against
            transaction records.{" "}
          </p>{" "}
        </div>{" "}
        <form
          action={handleSaveReconciliation}
          className="p-4 grid gap-4 sm:grid-cols-4"
        >
          {" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Period start{" "}
            </label>{" "}
            <input
              name="periodStart"
              type="date"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Period end{" "}
            </label>{" "}
            <input
              name="periodEnd"
              type="date"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Total (minor){" "}
            </label>{" "}
            <input
              name="totalMinor"
              type="number"
              defaultValue=""
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              {" "}
              Status{" "}
            </label>{" "}
            <Select
              name="status"
              defaultValue="open"
              className="min-h-10 w-full"
            >
              {" "}
              <option value="open">Open</option>{" "}
              <option value="in_review">In review</option>{" "}
              <option value="reconciled">Reconciled</option>{" "}
              <option value="disputed">Disputed</option>{" "}
            </Select>{" "}
          </div>{" "}
          <div className="flex items-end">
            {" "}
            <Button type="submit" size="sm">
              {" "}
              Save reconciliation{" "}
            </Button>{" "}
          </div>{" "}
        </form>{" "}
        <div className="overflow-x-auto p-4">
          {" "}
          <table className="w-full text-sm">
            {" "}
            <thead>
              {" "}
              <tr className="text-left text-xs text-ink-muted">
                {" "}
                <th className="p-3 font-bold">Period</th>{" "}
                <th className="p-3 font-bold text-right">Total</th>{" "}
                <th className="p-3 font-bold">Provider</th>{" "}
                <th className="p-3 font-bold">Status</th>{" "}
                <th className="p-3 font-bold">Created</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {reconciliations.length === 0 ? (
                <tr>
                  {" "}
                  <td colSpan={5} className="p-6 text-center text-ink-muted">
                    {" "}
                    <EmptyState title="No reconciliation records yet." />{" "}
                  </td>{" "}
                </tr>
              ) : (
                reconciliations.map((rec) => (
                  <ReconciliationRow
                    key={rec.id}
                    rec={rec as unknown as Reconciliation}
                  />
                ))
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
