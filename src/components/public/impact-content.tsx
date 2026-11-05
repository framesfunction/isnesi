// components/public/impact-content.tsx
import { ArrowRight, BookOpen, HandHeart, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/public/page-hero";
import { StoryCard } from "@/components/public/story-card";
import type { StorySummary } from "@/features/editorial/queries";
import type { ProgrammeSummary } from "@/features/programmes/queries";
import { siteConfig } from "@/lib/site";

/**
 * Designed Impact page sections.
 *
 * Every figure here is read live from the database; nothing is illustrative or
 * projected. Kept as small components so the public route can compose them; the
 * route renders these only when the CMS has no published "impact" page.
 */

/** Live published-figure band. */
export function ImpactFigures({
  programmesCount,
  partnersCount,
  storyCount,
}: {
  programmesCount: number;
  partnersCount: number;
  storyCount: number;
}) {
  const figures = [
    { value: `${programmesCount}`, label: "Active programmes" },
    { value: `${partnersCount}`, label: "Approved partners" },
    { value: `${storyCount}`, label: "Published stories" },
  ];

  return (
    <section className="border-y border-line bg-white/70">
      <dl className="mx-auto grid w-full max-w-6xl gap-px px-5 py-12 sm:grid-cols-3">
        {figures.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              {label}
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mx-auto w-full max-w-6xl px-5 pb-8 text-center text-xs text-ink-muted">
        These figures count what is published on this website today. They are not projections or
        illustrative targets.
      </p>
    </section>
  );
}

const MEASURE_STEPS = [
  {
    icon: HandHeart,
    title: "Listen first",
    body: "Children, families and schools tell us what is working and what still blocks participation.",
  },
  {
    icon: BookOpen,
    title: "Deliver with communities",
    body: "Support is planned with local partners, so it continues after a project ends.",
  },
  {
    icon: Sparkles,
    title: "Learn and adapt",
    body: "We track participation and progress, and change the work when the evidence says so.",
  },
  {
    icon: ShieldCheck,
    title: "Report honestly",
    body: "We publish what changed and what did not — never illustrative numbers presented as results.",
  },
] as const;

/** How ISNESI works towards impact. */
export function ImpactApproach() {
  return (
    <Section
      title="How we work towards impact"
      description="We measure change as it happens, alongside the people it affects."
    >
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MEASURE_STEPS.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            className="rounded-3xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]"
          >
            <div className="flex items-center justify-between">
              <span
                aria-hidden="true"
                className="inline-grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"
              >
                <Icon className="size-6" />
              </span>
              <span className="font-display text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h3 className="mt-4 font-display text-lg font-black text-brand">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/** Programme areas where the work is concentrated. */
export function ImpactByProgramme({ programmes }: { programmes: ProgrammeSummary[] }) {
  return (
    <Section
      title="Results by programme"
      description="Programme areas where our work is concentrated."
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
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programmes.map((programme) => (
          <li key={programme.id} className="rounded-3xl border border-line bg-white p-6">
            <span aria-hidden="true" className="text-3xl">
              {programme.icon ?? "•"}
            </span>
            <h3 className="mt-3 font-display text-lg font-black text-brand">{programme.title}</h3>
            {programme.summary ? (
              <p className="mt-2 text-sm leading-6 text-ink-muted">{programme.summary}</p>
            ) : null}
            <Link
              href={`/programmes/${programme.key}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand"
            >
              Learn more
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Latest published stories, shown as evidence of change. */
export function ImpactStories({ stories }: { stories: StorySummary[] }) {
  return (
    <Section
      title="Stories of change"
      description="What change looks like for the people behind it."
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
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </ul>
    </Section>
  );
}

const SUPPORT_AREAS = [
  {
    title: "Programmes & direct support",
    body: "Books, transport, therapy, assistive tools and classroom adaptations that remove barriers.",
  },
  {
    title: "Operations & delivery",
    body: "The staff, training and logistics that turn funding into support on the ground.",
  },
  {
    title: "Monitoring & accountability",
    body: "The reviews, safeguarding checks and reporting that keep the work honest.",
  },
] as const;

/** Where support goes — honest categories, no illustrative percentages. */
export function ImpactSupport() {
  return (
    <Section
      title="Where your support goes"
      description="How a donation is put to work, in plain terms."
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {SUPPORT_AREAS.map(({ title, body }) => (
          <li key={title} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-black text-brand">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-2xl text-xs text-ink-muted">
        We do not display illustrative percentages. Approved financial figures appear here once the
        organisation&apos;s financial reporting is published.
      </p>
    </Section>
  );
}

/** Call to action. */
export function ImpactCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand p-8 text-white sm:p-12">
        <div
          aria-hidden="true"
          className="absolute -left-16 -top-16 size-56 rounded-full border-[24px] border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 right-10 size-44 rounded-full bg-sun/20 blur-2xl"
        />
        <h2 className="relative max-w-2xl text-balance text-3xl font-black tracking-tight sm:text-4xl">
          Help us turn effort into lasting change.
        </h2>
        <p className="relative mt-4 max-w-2xl text-white/80">
          Your gift or your time helps children with disabilities learn, belong and thrive.{" "}
          <span className="font-display font-black text-sun">{siteConfig.tagline}</span>
        </p>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link
            href="/donate"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun px-7 text-sm font-black text-ink"
          >
            Donate
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            href="/get-involved"
            className="inline-flex min-h-12 items-center rounded-full border-2 border-white px-7 text-sm font-black text-white"
          >
            Get involved
          </Link>
        </div>
      </div>
    </section>
  );
}



