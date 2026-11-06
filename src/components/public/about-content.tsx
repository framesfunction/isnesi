// components/public/about-content.tsx
import {
  BookOpen,
  HandHeart,
  Heart,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";

import { CtaBand } from "@/components/public/cta-band";
import { GrowingBookIllustration } from "@/components/public/home-art";
import { Section } from "@/components/public/page-hero";
import type { PublicPartner } from "@/features/partners/queries";
import { siteConfig } from "@/lib/site";

/**
 * Designed About page sections.
 *
 * Kept as small, focused components so the public About route composes them and
 * each section stays readable. The route renders these only when the CMS has no
 * published "about" page; see app/(public)/about/page.tsx.
 */

/** Story, vision and mission. */
export function AboutStory() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="relative overflow-hidden rounded-4xl border border-line bg-white p-8 shadow-[0_24px_70px_rgba(27,63,160,0.10)]">
          <GrowingBookIllustration className="w-full" />
          <p className="mt-4 font-display text-2xl font-black leading-snug text-brand">
            Every barrier removed is a child moving forward.
          </p>
          <p className="mt-3 text-sm font-semibold italic text-ink-muted">
            Disability is part of human diversity.
          </p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf-strong">
            Hello, we&apos;re ISNESI
          </p>
          <h2 className="mt-3 text-balance text-3xl font-black tracking-tight text-brand sm:text-4xl">
            A world where every child has room to grow.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
            ISNESI — Inclusive Special Needs Education &amp; Social Innovation — works with
            children, families, educators and communities to build a more inclusive society. We
            focus on strengths, remove barriers and make participation possible, keeping each
            child&apos;s dignity at the centre.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-leaf-strong">
                Our vision
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                An inclusive, equitable society where every child and person with a disability has
                equal access to quality education, opportunity, dignity and full participation in
                community life.
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-coral-strong">
                Our mission
              </h3>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                To promote inclusive and special needs education through innovative, accessible and
                community-driven solutions that help children with disabilities and other
                vulnerable children learn, thrive and participate fully.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const ABOUT_VALUES = [
  {
    icon: Users,
    title: "Inclusion",
    body: "Children with disabilities learn alongside their peers, with the support that makes participation real.",
  },
  {
    icon: Heart,
    title: "Dignity",
    body: "Every child is treated as a person with strengths. Disability is part of human diversity, not a barrier to belonging.",
  },
  {
    icon: HeartHandshake,
    title: "Community-led",
    body: "Families, schools and local organisations shape the work, so support continues long after a project ends.",
  },
  {
    icon: BookOpen,
    title: "Learning first",
    body: "Accessible, inclusive education sits at the centre of everything we do.",
  },
  {
    icon: ShieldCheck,
    title: "Safeguarding",
    body: "Child safety comes first: review and clearance are required before anything about a child is published.",
  },
  {
    icon: HandHeart,
    title: "Partnership",
    body: "We work with government, schools, communities and other organisations to extend reach and share learning.",
  },
] as const;

/** "What guides us" values grid. */
export function AboutValues() {
  return (
    <Section
      title="What guides us"
      description="The principles behind every programme, story and donation we receive."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ABOUT_VALUES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-3xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]"
          >
            <span
              aria-hidden="true"
              className="inline-grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"
            >
              <Icon className="size-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-black text-brand">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Live published-figure band: counts reflect the database, not projections. */
export function AboutStats({
  programmesCount,
  partnersCount,
  storyCount,
}: {
  programmesCount: number;
  partnersCount: number;
  storyCount: number;
}) {
  const stats = [
    { value: `${programmesCount}`, label: "Active programmes" },
    { value: `${partnersCount}`, label: "Approved partners" },
    { value: `${storyCount}`, label: "Published stories" },
  ];

  return (
    <section className="border-y border-line bg-white/70">
      <dl className="mx-auto grid w-full max-w-6xl gap-px px-5 py-12 sm:grid-cols-3">
        {stats.map(({ value, label }) => (
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
        Counts reflect what is published on this website today, not projections.
      </p>
    </section>
  );
}

/** Approved partners, shown only when at least one is publicly recorded. */
export function AboutPartners({ partners }: { partners: PublicPartner[] }) {
  return (
    <Section
      title="Working in partnership"
      description="Approved partners, displayed only where a public relationship is recorded."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <li key={partner.id} className="rounded-3xl border border-line bg-white p-6">
            <h3 className="font-display text-lg font-extrabold text-brand">{partner.name}</h3>
            {partner.relationshipType ? (
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-leaf-strong">
                {partner.relationshipType}
              </p>
            ) : null}
            {partner.description ? (
              <p className="mt-3 text-sm leading-6 text-ink-muted">{partner.description}</p>
            ) : null}
            {partner.websiteUrl ? (
              <a
                href={partner.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-4 inline-block text-sm font-bold text-brand hover:underline"
              >
                Visit website
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Call to action. */
export function AboutCta() {
  return (
    <CtaBand
      eyebrow="Stand with us"
      title="Stand with children who deserve every chance to shine."
      description={
        <>
          Volunteer, partner or give what you can to support inclusive education.{" "}
          <span className="font-display font-black text-sun">{siteConfig.tagline}</span>
        </>
      }
      actions={[
        { label: "Get involved", href: "/get-involved", emphasis: "primary" },
        { label: "Donate", href: "/donate", emphasis: "secondary" },
      ]}
    />
  );
}

