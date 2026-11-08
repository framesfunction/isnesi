import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHero, Section } from "@/components/public/page-hero";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Complete your donation",
  description: "Complete your ISNESI donation by approving the payment prompt on your phone.",
};

type Donation = {
  id: string;
  public_reference: string;
  donor_name: string | null;
  amount_minor: number;
  currency: string;
  payment_status: string;
  provider_key: string | null;
  provider_transaction_id: string | null;
  receipt_number: string | null;
  paid_at: string | null;
  created_at: string;
  payer_phone: string | null;
};

export default async function DonationPaymentPage({
  params,
}: {
  params: Promise<{ donationId: string }>;
}) {
  const { donationId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, public_reference, donor_name, donor_email, amount_minor, currency, payment_status, provider_key, provider_transaction_id, payer_phone, receipt_number, paid_at, created_at",
    )
    .eq("id", donationId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const donation = data as Donation;
  const canPay =
    donation.payment_status === "created" && !!donation.provider_transaction_id;
  const isPaid = donation.payment_status === "succeeded";
  const isFailed = donation.payment_status === "failed";

  return (
    <div className="mx-auto max-w-2xl py-16 px-6">
      <PageHero
        eyebrow={isPaid ? "Payment confirmed" : "Complete your donation"}
        title={
          isPaid
            ? "Thank you for your gift"
            : donation.payment_status === "failed"
              ? "Payment not completed"
              : "Approve the payment on your phone"
        }
        description={
          isPaid
            ? "Your donation has been recorded and a receipt has been issued."
            : donation.payment_status === "failed"
              ? "The payment was not successful. You can try again or contact us."
              : "A payment prompt has been sent to your phone. Please approve it to complete your donation."
        }
      />

      <div className="grid gap-6">
        <Section title="Your donation" className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Reference
              </span>
              <span className="font-mono text-sm font-bold text-brand">
                {donation.public_reference}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Amount
              </span>
              <span className="text-2xl font-black text-brand">
                {formatCurrency(donation.amount_minor, donation.currency)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Status
              </span>
              <span className="font-mono text-sm text-ink-muted">
                {donation.payment_status.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Currency
              </span>
              <span className="font-mono text-sm font-bold text-ink">
                {donation.currency}
              </span>
            </div>
          </div>
          {donation.payer_phone && (
            <div className="mt-4 pt-4 border-t border-line/50">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Payer phone
              </span>
              <span className="mt-1 text-sm text-ink">{donation.payer_phone}</span>
            </div>
          )}
        </Section>

        {isPaid ? (
          <Section
            title="Payment confirmed"
            className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(24,36,67,0.06)]"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-leaf-soft p-2 text-leaf-strong">
                <ArrowRight className="size-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-brand">
                  Thank you for your donation
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Your contribution of {formatCurrency(
                    donation.amount_minor,
                    donation.currency,
                  )} has been recorded. A receipt has been issued.
                </p>
              </div>
            </div>
            {donation.receipt_number && (
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/donations/receipt/${donation.public_reference}`}
                  className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-strong"
                >
                  View receipt
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </Section>
        ) : isFailed ? (
          <Section title="Payment not completed" className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-coral/10 p-2 text-coral-strong">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-brand">
                  Payment not completed
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  The payment prompt was not approved. You can create a new
                  donation to try again.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-strong"
              >
                Create new donation
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </Section>
        ) : canPay ? (
          <Section title="Approve the payment on your phone" className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
            <p className="text-sm text-ink-muted">
              A payment prompt has been sent to your phone. Please open your
              mobile money app and approve the request to complete your
              donation.
            </p>
            <div className="mt-4 pt-4 border-t border-line/50">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Payment amount
              </p>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-3xl font-black text-brand">
                  {formatCurrency(donation.amount_minor, donation.currency)}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-strong w-full"
              >
                I&rsquo;ve approved the payment &mdash; check status
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Don&rsquo;t see the prompt? Make sure your phone has network coverage
              and check your mobile money app.
            </p>
          </Section>
        ) : (
          <Section title="Waiting for payment" className="rounded-[1.75rem] border border-line bg-white p-6 sm:p-8 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
            <p className="text-sm text-ink-muted">
              Your donation is being processed. Please wait while we confirm
              the payment with the provider.
            </p>
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
