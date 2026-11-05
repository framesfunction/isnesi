// app/(public)/impact/page.tsx
import type { Metadata } from "next";

import {
  ImpactApproach,
  ImpactByProgramme,
  ImpactCta,
  ImpactFigures,
  ImpactStories,
  ImpactSupport,
} from "@/components/public/impact-content";
import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { countPublishedStories, listPublishedStories } from "@/features/editorial/queries";
import { getPublicPage } from "@/features/pages/queries";
import { listPublicPartners } from "@/features/partners/queries";
import { listProgrammes } from "@/features/programmes/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Impact",
  description:
    "How ISNESI measures change: participation in inclusive education, support for families and community capacity.",
};

/**
 * Public Impact page.
 *
 * CMS-driven: a published page with the slug "impact" (and at least one section)
 * takes precedence. Until then this designed view reports what is published
 * today with live figures — never illustrative or projected numbers.
 */
export default async function ImpactPage() {
  const cmsPage = await getPublicPage("impact");

  if (cmsPage && cmsPage.sections.length > 0) {
    return (
      <>
        <PageHero
          eyebrow="Our impact"
          title={cmsPage.title}
          description={cmsPage.excerpt ?? undefined}
        />
        <Section>
          <PageSections sections={cmsPage.sections} />
        </Section>
      </>
    );
  }

  const [programmes, partners, stories, storyCount] = await Promise.all([
    listProgrammes(),
    listPublicPartners(),
    listPublishedStories({ limit: 3 }),
    countPublishedStories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Our impact"
        title="What our work changes"
        description="We report what changed for children, families and schools — not only what we delivered."
      />
      <ImpactFigures
        programmesCount={programmes.length}
        partnersCount={partners.length}
        storyCount={storyCount}
      />
      <ImpactApproach />
      {programmes.length > 0 ? <ImpactByProgramme programmes={programmes} /> : null}
      {stories.length > 0 ? <ImpactStories stories={stories} /> : null}
      <ImpactSupport />
      <ImpactCta />
    </>
  );
}
