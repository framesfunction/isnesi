// app/(public)/impact/page.tsx
import type { Metadata } from "next";
import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";

import {
  ImpactAccountability,
  ImpactApproach,
  ImpactByProgramme,
  ImpactCta,
  ImpactFigures,
  ImpactStories,
  ImpactSupport,
} from "@/components/public/impact-content";
import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { buildImpactJsonLd } from "@/features/impact/helpers";
import { getImpactSnapshot } from "@/features/impact/queries";
import { getPublicPage } from "@/features/pages/queries";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;

const IMPACT_PATH = "/impact";
const IMPACT_TITLE = "Impact";
const IMPACT_DESCRIPTION =
  "What our work changes: live counts of ISNESI programmes, partners and published stories — reported honestly, with no illustrative numbers.";

export const metadata: Metadata = {
  title: IMPACT_TITLE,
  description: IMPACT_DESCRIPTION,
  alternates: { canonical: IMPACT_PATH },
  openGraph: {
    type: "website",
    title: IMPACT_TITLE,
    description: IMPACT_DESCRIPTION,
    url: IMPACT_PATH,
  },
  twitter: {
    card: "summary",
    title: IMPACT_TITLE,
    description: IMPACT_DESCRIPTION,
  },
};

/**
 * Absolute site origin for structured data.
 *
 * Mirrors the helper used by the root layout and the sitemap; the trailing
 * slash is stripped so URLs join cleanly.
 */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Structured data for the page.
 *
 * Values come from `buildImpactJsonLd`, which only ever emits plain strings and
 * numbers, so the serialised payload cannot carry markup.
 */
function ImpactJsonLd({ data }: { data: Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Public Impact page.
 *
 * CMS-driven: a published page with the slug "impact" (and at least one section)
 * takes precedence. Until then this designed view reports what is published
 * today with live figures — never illustrative or projected numbers.
 */
export default async function ImpactPage() {
  const baseUrl = siteUrl();
  const cmsPage = await getPublicPage("impact");
  const snapshot = await getImpactSnapshot({ storyLimit: 3 });
  const description = cmsPage?.excerpt ?? IMPACT_DESCRIPTION;
  const title = cmsPage?.title ?? "What our work changes";

  return (
    <>
      <ImpactJsonLd
        data={buildImpactJsonLd({
          baseUrl,
          path: IMPACT_PATH,
          name: title,
          description,
          siteName: siteConfig.name,
        })}
      />

      <PageHero
        eyebrow="Our impact"
        title={title}
        description={description}
      >
        <Link
          href="/donate"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-black text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <Heart aria-hidden="true" className="size-4" />
          Support our work
        </Link>
        <Link
          href="/programmes"
          className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-brand bg-white px-6 text-sm font-black text-brand shadow-[0_4px_0_rgb(27_63_160/0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Explore programmes
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </PageHero>

      {cmsPage && cmsPage.sections.length > 0 ? (
        <Section>
          <PageSections sections={cmsPage.sections} />
        </Section>
      ) : null}
      <ImpactFigures figures={snapshot.figures} source={snapshot.figuresSource} />
      <ImpactApproach />
      <ImpactByProgramme programmes={snapshot.programmeAreas} />
      <ImpactStories stories={snapshot.stories} />
      <ImpactSupport />
      <ImpactAccountability />
      <ImpactCta />
    </>
  );
}
