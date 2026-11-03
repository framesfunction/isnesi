import type { Metadata } from "next";
import Link from "next/link";

import { PageHero, Section } from "@/components/public/page-hero";
import { getPublicSiteSettings } from "@/features/settings/queries";
import { formatCurrency } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support ISNESI's inclusive education and community programmes. Online giving is opened only once a verified payment provider is connected.",
};

const allocation = [
  { label: "Teaching and learning materials", share: "40%" },
  { label: "Therapy and specialist support", share: "35%" },
  { label: "Family and community engagement", share: "25%" },
];

export default async function DonatePage() {
  const settings = await getPublicSiteSettings();
  const currency = settings.donation.currency;
  const suggested = [5000, 15000, 50000];

  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Your gift keeps a child in the classroom"
        description="Every contribution is recorded, receipted and reconciled against the payment provider's settlement."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border-2 border-line bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-brand">Online giving</h2>

            {settings.donation.enabled ? (
              <div className="mt-4 rounded-2xl border-2 border-sun/60 bg-sun-soft p-4 text-sm text-ink">
                <strong className="font-black">Payment provider not connected.</strong> Online
                payments are enabled in settings but no provider adapter has been installed yet.
                Donations are only accepted once signature-verified payments are working — a
                browser redirect is never treated as proof of payment.
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border-2 border-sun/60 bg-sun-soft p-4 text-sm text-ink">
                <strong className="font-black">Online giving is not open yet.</strong> We are
                finalising a verified payment integration. Until then, please contact us to arrange a
                contribution and a receipt.
              </div>
            )}

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
              Suggested amounts
            </p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {suggested.map((amount) => (
                <li
                  key={amount}
                  className="rounded-2xl border-2 border-line bg-cream px-5 py-3 text-sm font-black text-brand"
                >
                  {formatCurrency(amount, currency)}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-xs text-ink-muted">
              Amounts are shown in {currency}. Every donation record stores an explicit currency
              code, an amount, a public reference and, once settled, a receipt number.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white"
              >
                Arrange a contribution
              </Link>
              <Link
                href="/get-involved"
                className="inline-flex min-h-12 items-center rounded-full border-2 border-brand px-6 text-sm font-bold text-brand"
              >
                Other ways to help
              </Link>
            </div>
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-2xl border-2 border-line bg-white p-5">
              <h2 className="font-display text-base font-extrabold text-brand">
                How funds are used
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-ink-muted">
                {allocation.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <span>{item.label}</span>
                    <span className="font-black text-brand">{item.share}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-brand p-5 text-white">
              <h2 className="font-display text-base font-extrabold">Accountability</h2>
              <ul className="mt-3 grid gap-2 text-sm text-white/80">
                <li>Payments are only confirmed by a verified provider webhook.</li>
                <li>Refunds require authorisation and are audited.</li>
                <li>Donor details are never sold or shared for marketing.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}