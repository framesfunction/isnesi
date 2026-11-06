// components/public/impact-content.tsx
import {
  ArrowRight,
  BookOpen,
  Check,
  Coins,
  Compass,
  HandHeart,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import { CtaBand } from "@/components/public/cta-band";
import { EmptyNote } from "@/components/public/empty-note";
import { Section } from "@/components/public/page-hero";
import { SectionLink } from "@/components/public/section-link";
import { StoryCard } from "@/components/public/story-card";
import type { StorySummary } from "@/features/editorial/queries";
import type { ImpactFigure } from "@/features/impact/helpers";
import type { ImpactFiguresSource } from "@/features/impact/queries";
import type { ProgrammeSummary } from "@/features/programmes/queries";
import { siteConfig } from "@/lib/site";

/**
 * Designed Impact page sections.
 *
 * Each section is a small, self-contained component so the route composes them
 * and this file stays readable. This page is the reference for other public
 * pages: one card treatment, one icon chip, one link style, one hover step.
 *
 * Every figure is read live from the database. Nothing here is illustrative or
 * projected; where a marketing page would print a percentage, we print the
 * truth instead.
 */

/** One card treatment for the whole page: one radius, one shadow, one hover step. */
const CARD = "rounded-[1.75rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,36,67,0.06)]";
const CARD_HOVER = "transition-transform hover:-translate-y-1 focus-within:-translate-y-1";

const FIGURES_COPY: Record<ImpactFiguresSource, { intro: string; note: string }> = {
  metrics: {
    intro:
      "Approved figures, reviewed before publication. Each one carries a source, so a number can always be checked.",
    note:
      "These figures are approved for publication and are re-reviewed whenever the underlying reporting changes.",
  },
  "published-records": {
    intro:
      "Live counts, read from what ISNESI has published. Each figure links to the page that evidences it, so a number can always be checked.",
    note:
      "No approved impact figures are published yet, so these are live counts of published records. They are not projections or illustrative targets.",
  },
};

/** Live published-figure band. */
export function ImpactFigures({
  figures,
  source,
}: {
  figures: ImpactFigure[];
  source: ImpactFiguresSource;
}) {
  if (figures.length === 0) return null;

  const copy = FIGURES_COPY[source];
  const linkClass =
    "mt-5 inline-flex items-center gap-2 rounded-full text-sm font-bold text-brand hover:underline";

  return (
    <section aria-labelledby="impact-figures-title" className="border-b border-line bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <h2 id="impact-figures-title" className="text-3xl font-black tracking-tight text-brand">
            Impact at a glance
          </h2>
          <p className="mt-2 text-ink-muted">{copy.intro}</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {figures.map((figure) => (
            <li
              key={figure.key}
              className={`${CARD} ${CARD_HOVER} group flex flex-col bg-cream p-7`}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                {figure.label}
              </p>
              <p className="mt-3 font-display text-5xl font-black leading-none text-brand sm:text-6xl">
                {figure.display}
              </p>
              {figure.description ? (
                <p className="mt-4 flex-1 text-sm leading-6 text-ink-muted">{figure.description}</p>
              ) : (
                <span className="flex-1" />
              )}
              {figure.href && figure.linkLabel ? (
                figure.href.startsWith("/") ? (
                  <Link href={figure.href} className={linkClass}>
                    {figure.linkLabel}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                ) : (
                  <a
                    href={figure.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={linkClass}
                  >
                    {figure.linkLabel}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform group-hover:translate-x-1"
                    />
                  </a>
                )
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-ink-muted">{copy.note}</p>
      </div>
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
    icon: Compass,
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
      title="How we measure change"
      description="Impact is a practice, not a poster. Four commitments keep our reporting honest."
    >
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MEASURE_STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} className={`${CARD} flex flex-col p-6`}>
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
            <h3 className="mt-5 font-display text-lg font-black text-brand">{title}</h3>
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
      description="Where the work is concentrated today, and how to see each programme in full."
      className="border-y border-line/70 bg-white"
      action={<SectionLink href="/programmes">All programmes</SectionLink>}
    >
      {programmes.length === 0 ? (
        <EmptyNote title="No programmes published yet">
          Programme information is loaded from the database. Activate programmes in the admin panel
          and they appear here within a few minutes.
        </EmptyNote>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((programme) => (
            <li
              key={programme.id}
              className={`${CARD} ${CARD_HOVER} group relative flex flex-col overflow-hidden p-6`}
            >
              <div
                aria-hidden="true"
                className="absolute -right-6 -top-6 size-20 rounded-full bg-brand-soft transition-colors group-hover:bg-sun-soft"
              />
              <span
                aria-hidden="true"
                className="relative grid size-14 place-items-center rounded-2xl bg-sun-soft text-2xl leading-none shadow-sm"
              >
                {programme.icon ?? programme.title.charAt(0)}
              </span>
              <h3 className="relative mt-5 font-display text-xl font-black text-brand">
                {programme.title}
              </h3>
              {programme.summary ? (
                <p className="relative mt-2 flex-1 text-sm leading-6 text-ink-muted">
                  {programme.summary}
                </p>
              ) : (
                <span className="flex-1" />
              )}
              <Link
                href={`/programmes/${programme.key}`}
                className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand"
              >
                Learn more
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** Latest published stories, shown as evidence of change. */
export function ImpactStories({ stories }: { stories: StorySummary[] }) {
  return (
    <Section
      title="Change, in people's own words"
      description="Stories published only after editorial review and recorded safeguarding clearance."
      action={<SectionLink href="/stories">All stories</SectionLink>}
    >
      {stories.length === 0 ? (
        <EmptyNote title="No stories published yet">
          Stories appear here once an editor has published them after review. Drafts are never shown
          to visitors.
        </EmptyNote>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </ul>
      )}
    </Section>
  );
}

const SUPPORT_AREAS = [
  {
    icon: Sparkles,
    title: "Programmes & direct support",
    body: "Books, transport, therapy, assistive tools and classroom adaptations that remove barriers.",
  },
  {
    icon: Coins,
    title: "Operations & delivery",
    body: "The staff, training and logistics that turn funding into support on the ground.",
  },
  {
    icon: Search,
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
      className="border-y border-line/70 bg-white"
    >
      <ul className="grid gap-5 sm:grid-cols-3">
        {SUPPORT_AREAS.map(({ icon: Icon, title, body }) => (
          <li key={title} className={`${CARD} flex flex-col p-6`}>
            <span
              aria-hidden="true"
              className="inline-grid size-12 place-items-center rounded-2xl bg-leaf-soft text-leaf"
            >
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 font-display text-lg font-black text-brand">{title}</h3>
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

const PUBLISH_COMMITMENTS = [
  "Live counts of programmes, partners and stories that are actually published.",
  "Approved financial figures, in full, once independent reporting is released.",
  "Stories only after editorial review and recorded safeguarding clearance.",
] as const;

const REFUSED_PRACTICES = [
  "Projected or estimated results presented as achieved outcomes.",
  "Illustrative percentages standing in for real financial reporting.",
  "Any image or story about a child without recorded consent.",
] as const;

/** Transparency: what we publish, and what we refuse to. */
export function ImpactAccountability() {
  return (
    <Section
      title="Accountable by design"
      description="Transparency is the point of an impact page, so we state what we publish and what we never will."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-line bg-leaf-soft p-7">
          <h3 className="font-display text-lg font-black text-brand">What we publish</h3>
          <ul className="mt-4 grid gap-3">
            {PUBLISH_COMMITMENTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-leaf text-white"
                >
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.75rem] border border-line bg-sun-soft p-7">
          <h3 className="font-display text-lg font-black text-brand">What we never do</h3>
          <ul className="mt-4 grid gap-3">
            {REFUSED_PRACTICES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6 text-ink">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-coral-strong text-white"
                >
                  <X className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/** Call to action. */
export function ImpactCta() {
  return (
    <CtaBand
      eyebrow="Turn effort into change"
      title="Help us keep reporting what is real."
      description={
        <>
          Your gift or your time helps children with disabilities learn, belong and thrive.{" "}
          <span className="font-display font-black text-sun">{siteConfig.tagline}</span>
        </>
      }
      actions={[
        { label: "Donate", href: "/donate", emphasis: "primary" },
        { label: "Get involved", href: "/get-involved", emphasis: "secondary" },
      ]}
    />
  );
}
