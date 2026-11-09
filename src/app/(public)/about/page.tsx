// app/(public)/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import {
  AboutCta,
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

  const [programmes, partners, storyCount] = await Promise.all([
    listProgrammes(),
    listPublicPartners(),
    countPublishedStories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="About ISNESI"
        title={cmsPage?.title ?? "Who we are"}
        description={
          cmsPage?.excerpt ??
          "ISNESI exists so that children with disabilities can learn, belong and thrive in their own communities."
        }
      />
      {cmsPage && cmsPage.sections.length > 0 ? (
        <Section>
          <PageSections sections={cmsPage.sections} />
        </Section>
      ) : null}
      <AboutStory />
      {programmes.length > 0 ? (
        <Section
          title="Our programmes"
          description="Programme areas ISNESI delivers, each with imagery from the media library."
        >
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme) => (
              <li
                key={programme.id}
                className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1"
              >
                <div className="relative h-48 w-full overflow-hidden rounded-[1.75rem] bg-muted mb-4 group-hover:scale-105 transition-transform duration-300">
                  {programme.featuredImageUrl ? (
                    <Image
                      src={programme.featuredImageUrl}
                      alt={programme.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-xs text-ink-muted">
                      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-soft text-2xl leading-none shadow-sm">
                        {programme.icon ?? programme.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="mt-3 font-display text-xl font-black text-brand">
                  {programme.title}
                </h2>
                {programme.summary ? (
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{programme.summary}</p>
                ) : null}
                <Link
                  href={`/programmes/${programme.key}`}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-brand"
                >
                  Learn more
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <AboutStats
        programmesCount={programmes.length}
        partnersCount={partners.length}
        storyCount={storyCount}
      />
      <AboutValues />
      {partners.length > 0 ? <AboutPartners partners={partners} /> : null}
      <AboutCta />
    </>
  );
}
