import { ArrowRight, Baby, BookOpen, HeartHandshake } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { CtaBand } from "@/components/public/cta-band";
import { PageHero, Section } from "@/components/public/page-hero";
import { DonationForm } from "@/components/public/donation-form";
import { getPublicSiteSettings } from "@/features/settings/queries";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { isServiceRoleConfigured } from "@/lib/env";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support ISNESI's inclusive education and community programmes. Make a donation online or contact us for other ways to give.",
};

const uses = [
  { icon: BookOpen, label: "Teaching and learning materials" },
  { icon: Baby, label: "Therapy and specialist support" },
  { icon: HeartHandshake, label: "Family and community engagement" },
];

export default async function DonatePage() {
  const { donation } = await getPublicSiteSettings();
  const currency = donation.currency;
  const currencies = donation.currencies.includes(currency)
    ? donation.currencies
    : [currency, ...donation.currencies];
  const suggested = [5000, 15000, 50000];
  const onlineGivingOpen = isServiceRoleConfigured() && !!process.env.MOMO_API_USER;

  return (
    <>
      <PageHero
        eyebrow="Give"
        title="Your gift keeps a child in the classroom"
        description="Every contribution is recorded, receipted and used for the programmes you read about on this site."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-brand">
              Ways to give
            </h2>

            {onlineGivingOpen ? (
              <>
                <DonationForm
                  suggestedAmounts={suggested}
                  defaultCurrency={currency}
                />
              </>
            ) : (
              <>
                <div className="mt-4 rounded-2xl border-2 border-sun/60 bg-sun-soft p-4 text-sm text-ink">
                  <strong className="font-black">Online giving is not open yet.</strong> Payments are
                  only accepted once a verified mobile money provider is connected — a payment is never
                  confirmed by a redirect. Until then, use the channels below and we will record and
                  receipt your contribution.
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Contribution channels
                </p>
                <ul className="mt-3 grid gap-3 text-sm text-ink">
                  <li className="rounded-2xl border-2 border-line bg-cream p-4">
                    <span className="font-black text-brand">Mobile Money (XAF)</span> — MTN MoMo
                    collection is being activated; once live you approve a payment prompt on your phone
                    and a receipt is issued automatically.
                  </li>
                  {currencies
                    .filter((code) => code !== "XAF")
                    .map((code) => (
                      <li key={code} className="rounded-2xl border-2 border-line bg-cream p-4">
                        <span className="font-black text-brand">{code}</span> — bank transfer or
                        international giving: contact us and the team shares the current account
                        details and issues your receipt.
                      </li>
                    ))}
                </ul>

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">
                  Suggested amounts ({currency})
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
                  Amounts are shown in {currency}, the organisation&apos;s reporting currency; gifts in{" "}
                  {currencies.filter((code) => code !== currency).join(", ") || "other currencies"} are
                  recorded in their original currency. Every donation record stores an explicit currency
                  code, an amount and a public reference — and a receipt number once settled.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none"
                  >
                    Arrange a contribution
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                  <Link
                    href="/get-involved"
                    className="inline-flex min-h-12 items-center rounded-full border-2 border-line bg-white px-6 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
                  >
                    Other ways to help
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="grid content-start gap-4">
            <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
              <h2 className="font-display text-base font-extrabold text-brand">
                How funds are used
              </h2>
              <ul className="mt-4 grid gap-3 text-sm text-ink-muted">
                {uses.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-grid size-9 shrink-0 place-items-center rounded-xl bg-leaf-soft"
                    >
                      <Icon className="size-4.5 text-leaf-strong" />
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
                <p className="mt-4 text-xs text-ink-muted">
                  We do not publish illustrative percentages. Approved financial figures appear on the{" "}
                  <Link href="/impact" className="font-bold text-brand hover:underline">
                    Impact page
                  </Link>{" "}
                  once the organisation&apos;s financial reporting is released.
                </p>
              </ul>
            </div>

            <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-brand p-6 text-white">
              <div
                aria-hidden="true"
                className="absolute -bottom-10 -right-8 size-40 rounded-full bg-white/5"
              />
              <h2 className="font-display text-base font-extrabold">Accountability</h2>
              <ul className="relative mt-3 grid gap-2 text-sm text-white/80">
                <li>Payments are only confirmed by a verified provider webhook.</li>
                <li>Refunds require authorisation and are audited.</li>
                <li>Donor details are never sold or shared for marketing.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        eyebrow="Stand with us"
        title={siteConfig.tagline}
        description="A gift, an hour of volunteering or a newsletter subscription — every kind of support helps children learn, belong and thrive."
        actions={[
          { label: "Get involved", href: "/get-involved" },
          { label: "Questions about giving? Contact us", href: "/contact", emphasis: "secondary" },
        ]}
      />
    </>
  );
}
