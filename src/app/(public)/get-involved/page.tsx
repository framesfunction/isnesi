import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { EnquiryForm } from "@/components/public/enquiry-form";
import {
  GetInvolvedCta,
  GetInvolvedFaq,
  HowItWorks,
  SafeguardingPanels,
  WaysToHelp,
} from "@/components/public/get-involved-content";
import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { buildGetInvolvedJsonLd } from "@/features/enquiries/helpers";
import { getPublicPage } from "@/features/pages/queries";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;

const PATH = "/get-involved";
const FALLBACK_TITLE = "Stand with every child";
const FALLBACK_DESCRIPTION =
  "There are many ways to contribute. Tell us what you have in mind and the right person will reply.";

export const metadata: Metadata = {
  title: "Get involved",
  description:
    "Volunteer, partner, fundraise or give with ISNESI and help every child learn, belong and thrive.",
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: "Get involved",
    description:
      "Volunteer, partner, fundraise or give with ISNESI and help every child learn, belong and thrive.",
    url: PATH,
  },
  twitter: {
    card: "summary",
    title: "Get involved",
    description:
      "Volunteer, partner, fundraise or give with ISNESI and help every child learn, belong and thrive.",
  },
};

/** Absolute site origin for structured data; mirrors the root layout helper. */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Structured data for the page; values are plain strings, never markup. */
function GetInvolvedJsonLd({ data }: { data: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Public Get Involved page.
 *
 * A published CMS page with the slug "get-involved" supplies the hero copy and
 * adds its sections below the hero; the ways to help, the enquiry form and the
 * safeguarding notes always render, because taking an enquiry is the purpose of
 * this page.
 */
export default async function GetInvolvedPage() {
  const cmsPage = await getPublicPage("get-involved");
  const cmsSections = cmsPage?.sections ?? [];
  const hasCmsIntro = cmsSections.length > 0;

  const title = (hasCmsIntro ? cmsPage?.title : null) ?? FALLBACK_TITLE;
  const description = (hasCmsIntro ? cmsPage?.excerpt : null) ?? FALLBACK_DESCRIPTION;

  return (
    <>
      <GetInvolvedJsonLd
        data={buildGetInvolvedJsonLd({
          baseUrl: siteUrl(),
          path: PATH,
          name: title,
          description,
          siteName: siteConfig.name,
        })}
      />

      <PageHero
        eyebrow="Get involved"
        title={title}
        description={description}
      >
        <a
          href="#enquiry"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-black text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Start an enquiry
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
        <Link
          href="/donate"
          className="inline-flex min-h-12 items-center rounded-full border-2 border-brand bg-white px-6 text-sm font-black text-brand shadow-[0_4px_0_rgb(27_63_160/0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Donate
        </Link>
      </PageHero>

      {hasCmsIntro ? (
        <Section>
          <PageSections sections={cmsSections} />
        </Section>
      ) : null}

      <WaysToHelp />
      <HowItWorks />

      <Section id="enquiry">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <EnquiryForm
            kinds={["volunteer", "partnership", "other"]}
            title="Tell us how you would like to help"
            description="Choose what fits best and add a short note about your skills, organisation or idea."
          />
          <div className="grid content-start gap-4">
            <div className="rounded-2xl bg-brand-soft p-6">
              <h2 className="font-display text-base font-extrabold text-brand">
                What happens to your message
              </h2>
              <ul className="mt-3 grid gap-2 text-sm text-ink-muted">
                <li>A person reads it — there is no automated reply.</li>
                <li>It is stored securely and used only to answer your enquiry.</li>
                <li>It is never sold or shared with third parties.</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-line bg-white p-6">
              <h2 className="font-display text-base font-extrabold text-brand">
                Reporting something urgent
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                This form is for general enquiries only. If a child is at risk, contact local
                emergency or child-protection services first, then tell the ISNESI team directly.{" "}
                <Link href="/contact" className="font-bold text-brand hover:underline">
                  Other ways to reach us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </Section>

      <SafeguardingPanels />
      <GetInvolvedFaq />
      <GetInvolvedCta />
    </>
  );
}
