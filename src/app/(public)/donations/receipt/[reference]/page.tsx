import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donation receipt",
};

export default async function DonationReceiptPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const supabase = await createClient();
  const { data: donation, error } = await supabase
    .from("donations")
    .select(
      "id, public_reference, donor_name, donor_email, amount_minor, currency, payment_status, payer_phone, receipt_number, paid_at, created_at",
    )
    .eq("public_reference", reference)
    .maybeSingle();

  if (error || !donation || donation.payment_status !== "succeeded" || !donation.receipt_number) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-6">
        <h1 className="text-3xl font-black tracking-tight text-brand">Receipt not found</h1>
        <p className="mt-4 text-lg text-ink-muted">
          No receipt could be found for this donation. It may not have been
          successfully paid yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-16 px-6">
      <div className="rounded-[1.75rem] border-2 border-line bg-white p-8 sm:p-12 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2 py-1 text-brand font-mono text-sm">
                ISNESI
              </span>
              <span className="font-bold text-xl text-brand">ISNESI</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Inclusive education for every child
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <h2 className="text-2xl font-black text-brand">Official receipt</h2>
            <p className="text-sm text-ink-muted">
              Receipt #{donation.receipt_number}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              Amount
            </span>
            <p className="mt-1 font-mono text-2xl font-black text-brand">
              {formatCurrency(donation.amount_minor, donation.currency)}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              Currency
            </span>
            <p className="mt-1 font-mono text-sm font-bold text-ink">
              {donation.currency}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              Reference
            </span>
            <p className="mt-1 font-mono text-sm font-bold text-brand">
              {donation.public_reference}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              Receipt #</span>
            <p className="mt-1 font-mono text-sm font-bold text-brand">
              {donation.receipt_number}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-line bg-white p-6">
          <h3 className="font-black text-lg text-brand mb-4">Donor details</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-ink-muted">Name</span>
              <span className="text-sm text-ink">
                {donation.donor_name ?? "Anonymous donor"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-ink-muted">Email</span>
              <span className="text-sm text-ink">
                {donation.donor_email ?? "Not provided"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-ink-muted">Phone</span>
              <span className="text-sm text-ink">
                {donation.payer_phone ?? "Not provided"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-ink-muted">Date</span>
              <span className="text-sm text-ink">
                {formatDate(donation.paid_at ?? donation.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-line bg-white p-6">
          <h3 className="font-black text-lg text-brand mb-4">Purpose</h3>
          <p className="text-sm text-ink-muted">
            Your contribution supports ISNESI&rsquo;s inclusive education programmes,
            helping children with disabilities learn, belong and thrive in their
            communities. No goods or services were provided in exchange for this
            contribution.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-ink-muted">
            This receipt is issued by ISNESI for your records. Please keep it
            for tax and accounting purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
