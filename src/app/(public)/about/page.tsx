// app/(public)/about/page.tsx
import type { Metadata } from "next";

import {
  AboutCta,
  AboutNewsletter,
  AboutPartners,
  AboutStats,
  AboutStory,
  AboutValues,
} from "@/components/public/about-content";
import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { countPublishedStories } from "@/features/editorial/queries";
import { getPublicPage } from "@/features/pages/queries";
import { listPublicPartners } from "@/features/partners/queries";
import { listProgrammes } from "@/features/programmes/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About",
  description:
    "Who ISNESI is, why we exist, and how we work with families, schools and communities to leave no child behind.",
};

/**
 * Public About page.
 *
 * CMS-driven: a published page with the slug "about" (and at least one section)
 * takes precedence. Until then this designed view presents ISNESI's real story,
 * vision and mission with live, verified figures — never invented statistics.
 */
export default async function AboutPage() {
  const cmsPage = await getPublicPage("about");

  if (cmsPage && cmsPage.sections.length > 0) {
    return (
      <>
        <PageHero
          eyebrow="About ISNESI"
          title={cmsPage.title}
          description={cmsPage.excerpt ?? undefined}
        />
        <Section>
          <PageSections sections={cmsPage.sections} />
        </Section>
      </>
    );
  }

  const [programmes, partners, storyCount] = await Promise.all([
    listProgrammes(),
    listPublicPartners(),
    countPublishedStories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="About ISNESI"
        title="Who we are"
        description="ISNESI exists so that children with disabilities can learn, belong and thrive in their own communities."
      />
      <AboutStory />
      <AboutStats
        programmesCount={programmes.length}
        partnersCount={partners.length}
        storyCount={storyCount}
      />
      <AboutValues />
      {partners.length > 0 ? <AboutPartners partners={partners} /> : null}
      <AboutCta />
      <AboutNewsletter />
    </>
  );
}
