import { ArrowRight, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/public/page-hero";
import { StoryCard } from "@/components/public/story-card";
import { listPublishedStories } from "@/features/editorial/queries";
import { listPublicPartners } from "@/features/partners/queries";
import { listProgrammes } from "@/features/programmes/queries";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;

const approach = [
  {
    title: "Inclusive education first",
    body: "Children with disabilities learn alongside their peers, with the support that makes participation real.",
  },
  {
    title: "Community-led delivery",
    body: "Families, schools and local organisations shape the work, so support continues after a project ends.",
  },
  {
    title: "Accountable and safe",
    body: "Safeguarding, consent and evidence are built into every programme, story and donation we receive.",
  },
];

export default async function HomePage() {
  const [programmes, stories, partners] = await Promise.all([
    listProgrammes(),
    listPublishedStories({ limit: 3 }),
    listPublicPartners(),
  ]);

  return (
    <>
      <section className="border-b-2 border-line/70 bg-brand-soft/70">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-leaf">
              <Sparkles aria-hidden="true" className="size-4" />
              {siteConfig.name} · Inclusive education
            </p>
            <h1 className="mt-5 text-balance text-4xl font-black leading-[1.05] tracking-tight text-brand sm:text-5xl lg:text-6xl">
              We leave no child behind.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-muted">
              {siteConfig.description} We work with families, schools and communities so that every
              child can learn, belong and thrive.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/get-involved"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-[0_4px_0_#10296e] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Get involved
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/donate"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun px-6 text-sm font-bold text-ink shadow-[0_4px_0_#c38b00] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Heart aria-hidden="true" className="size-4" />
                Donate
              </Link>
              <Link
                href="/programmes"
                className="inline-flex min-h-12 items-center rounded-full border-2 border-brand bg-white px-6 text-sm font-bold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Our programmes
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-line bg-white p-6 shadow-[0_24px_60px_rgba(24,36,67,0.08)]">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-ink-muted">
              How we work
            </h2>
            <ul className="mt-4 grid gap-4">
              {approach.map((item) => (
                <li key={item.title} className="rounded-2xl bg-brand-soft p-4">
                  <p className="font-display text-base font-extrabold text-brand">{item.title}</p>
                  <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Section
        title="Our programmes"
        description="Six connected programme areas, managed in the ISNESI admin panel and published here."
        action={
          <Link
            href="/programmes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
          >
            All programmes
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      >
        {programmes.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-sm text-ink-muted">
            Programme information will appear here as soon as published programmes are available.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme) => (
              <li
                key={programme.id}
                className="rounded-3xl border-2 border-line bg-white p-6 transition-colors hover:border-brand/40"
              >
                <span aria-hidden="true" className="text-3xl">
                  {programme.icon ?? "•"}
                </span>
                <h3 className="mt-3 font-display text-lg font-extrabold text-brand">
                  {programme.title}
                </h3>
                {programme.summary ? (
                  <p className="mt-2 text-sm text-ink-muted">{programme.summary}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Stories from our community"
        description="Editorially reviewed stories and news. Every child-related story requires safeguarding clearance before publication."
        className="border-y-2 border-line/70 bg-white"
        action={
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
          >
            All stories
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      >
        {stories.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-line bg-cream p-6 text-sm text-ink-muted">
            No stories have been published yet. Safeguarding-cleared stories and news will appear
            here once an editor publishes them.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </ul>
        )}
      </Section>

      {partners.length > 0 ? (
        <Section
          title="Working in partnership"
          description="Approved partners only. A partner is never displayed as an endorsement without recorded approval."
        >
          <ul className="flex flex-wrap items-center gap-3">
            {partners.map((partner) => (
              <li
                key={partner.id}
                className="rounded-2xl border-2 border-line bg-white px-5 py-4 text-sm font-bold text-ink"
              >
                {partner.websiteUrl ? (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="transition-colors hover:text-brand"
                  >
                    {partner.name}
                  </a>
                ) : (
                  partner.name
                )}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section className="pb-20">
        <div className="rounded-3xl bg-brand p-8 text-white sm:p-12">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Every child deserves a place to learn, belong and thrive.
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">
            Whether you can give time, expertise or funding, there is a way to stand with ISNESI.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/get-involved"
              className="inline-flex min-h-12 items-center rounded-full bg-sun px-6 text-sm font-bold text-ink"
            >
              Volunteer or partner
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center rounded-full border-2 border-white px-6 text-sm font-bold text-white"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}