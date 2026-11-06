import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

import { CtaBand } from "@/components/public/cta-band";
import { EmptyNote } from "@/components/public/empty-note";
import {
  KidsGrownUpNote,
  KidsResourceCard,
  KidsSafetyBand,
} from "@/components/public/kids-content";
import { PageHero, Section } from "@/components/public/page-hero";
import { listKidsResources } from "@/features/kids/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kids' Corner",
  description:
    "Age-appropriate stories, activities and learning resources for children, reviewed for child safety before publication.",
};

export default async function KidsCornerPage() {
  const resources = await listKidsResources();

  return (
    <>
      <PageHero
        eyebrow="Kids' Corner"
        title="Learn, play and explore"
        description="Age-appropriate stories, activities and games — every one of them passed a child-safety review before it was published."
      >
        <a
          href="#library"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-black text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Jump to the library
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
        <Link
          href="/programmes"
          className="inline-flex min-h-12 items-center rounded-full border-2 border-line bg-white px-6 text-sm font-black text-brand transition-colors hover:bg-brand-soft"
        >
          Grown-ups, see how we work
        </Link>
      </PageHero>

      <KidsSafetyBand />

      <Section
        id="library"
        title="Explore the library"
        description={
          resources.length > 0
            ? resources.length === 1
              ? "One resource is ready to enjoy — and it passed the review above."
              : `${resources.length} resources are ready — every one of them passed the review above.`
            : undefined
        }
      >
        {resources.length === 0 ? (
          <EmptyNote title="No resources published yet">
            Resources only appear here once they are published and marked as safeguarding-approved. A
            resource cannot bypass that review — by design, not by promise.
          </EmptyNote>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <KidsResourceCard key={resource.id} resource={resource} />
            ))}
          </ul>
        )}
      </Section>

      <KidsGrownUpNote />

      <CtaBand
        eyebrow="Made for grown-ups"
        title="Questions about what children see?"
        description="A staff member reads every message. Tell us what works, what is missing or what should change."
        actions={[
          { label: "Contact the team", href: "/contact" },
          { label: "See how we work", href: "/programmes" },
        ]}
      />
    </>
  );
}
