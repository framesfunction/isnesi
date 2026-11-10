// app/(public)/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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

/** About page sections driven by live data, not CMS content. */
function AboutDynamicLists({
  programmes,
  partners,
  storyCount,
}: {
  programmes: Awaited<ReturnType<typeof listProgrammes>>;
  partners: Awaited<ReturnType<typeof listPublicPartners>>;
  storyCount: number;
}) {
  return (
    <>
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
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {programme.summary}
                  </p>
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

      <section className="border-y border-line bg-white/70">
        <dl className="mx-auto grid w-full max-w-6xl gap-px px-5 py-12 sm:grid-cols-3">
          <div key="programmes" className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Active programmes
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {programmes.length}
            </dd>
          </div>
          <div key="partners" className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Approved partners
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {partners.length}
            </dd>
          </div>
          <div key="stories" className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Published stories
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {storyCount}
            </dd>
          </div>
        </dl>
        <p className="mx-auto w-full max-w-6xl px-5 pb-8 text-center text-xs text-ink-muted">
          Counts reflect what is published on this website today, not projections.
        </p>
      </section>

      {partners.length > 0 ? (
        <Section
          title="Working in partnership"
          description="Approved partners, displayed only where a public relationship is recorded."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <li key={partner.id} className="rounded-3xl border border-line bg-white p-6">
                <h3 className="font-display text-lg font-extrabold text-brand">
                  {partner.name}
                </h3>
                {partner.relationshipType ? (
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-leaf-strong">
                    {partner.relationshipType}
                  </p>
                ) : null}
                {partner.description ? (
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {partner.description}
                  </p>
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
      ) : null}
    </>
  );
}

/** The original about page design, kept as the default when no CMS page exists. */
function DefaultAboutContent({
  programmes,
  partners,
  storyCount,
}: {
  programmes: Awaited<ReturnType<typeof listProgrammes>>;
  partners: Awaited<ReturnType<typeof listPublicPartners>>;
  storyCount: number;
}) {
  const ABOUT_VALUES = [
    {
      icon: "Users",
      title: "Inclusion",
      body: "Children with disabilities learn alongside their peers, with the support that makes participation real.",
    },
    {
      icon: "Heart",
      title: "Dignity",
      body: "Every child is treated as a person with strengths. Disability is part of human diversity, not a barrier to belonging.",
    },
    {
      icon: "HeartHandshake",
      title: "Community-led",
      body: "Families, schools and local organisations shape the work, so support continues long after a project ends.",
    },
    {
      icon: "BookOpen",
      title: "Learning first",
      body: "Accessible, inclusive education sits at the centre of everything we do.",
    },
    {
      icon: "ShieldCheck",
      title: "Safeguarding",
      body: "Child safety comes first: review and clearance are required before anything about a child is published.",
    },
    {
      icon: "HandHeart",
      title: "Partnership",
      body: "We work with government, schools, communities and other organisations to extend reach and share learning.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="About ISNESI"
        title="Who we are"
        description="ISNESI exists so that children with disabilities can learn, belong and thrive in their own communities."
      />
      <section className="mx-auto w-full max-w-6xl px-5 py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="relative overflow-hidden rounded-4xl border border-line bg-white p-8 shadow-[0_24px_70px_rgba(27,63,160,0.10)]">
            <div className="w-full">
              {/* GrowingBookIllustration placeholder kept as CSS-only decorative box */}
              <div className="relative overflow-hidden rounded-[2.25rem] border border-line bg-white p-8 shadow-[0_24px_70px_rgba(27,63,160,0.10)] h-64 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
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

      <Section
        title="What guides us"
        description="The principles behind every programme, story and donation we receive."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ABOUT_VALUES.map(({ icon: IconName, title, body }) => {
            const iconMap: Record<string, string> = {
              Users: "👥",
              Heart: "❤️",
              HeartHandshake: "🤝",
              BookOpen: "📖",
              ShieldCheck: "🛡️",
              HandHeart: "🤲",
            };
            const Icon = iconMap[IconName] ?? "•";
            return (
              <li
                key={title}
                className="rounded-3xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]"
              >
                <span
                  aria-hidden="true"
                  className="inline-grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"
                >
                  {Icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-black text-brand">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <section className="border-y border-line bg-white/70">
        <dl className="mx-auto grid w-full max-w-6xl gap-px px-5 py-12 sm:grid-cols-3">
          <div key="programmes" className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Active programmes
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {programmes.length}
            </dd>
          </div>
          <div key="partners" className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Approved partners
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {partners.length}
            </dd>
          </div>
          <div key="stories" className="flex flex-col items-center gap-1 px-4 text-center">
            <dt className="order-2 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
              Published stories
            </dt>
            <dd className="order-1 font-display text-4xl font-black text-brand sm:text-5xl">
              {storyCount}
            </dd>
          </div>
        </dl>
        <p className="mx-auto w-full max-w-6xl px-5 pb-8 text-center text-xs text-ink-muted">
          Counts reflect what is published on this website today, not projections.
        </p>
      </section>

      {partners.length > 0 ? (
        <Section
          title="Working in partnership"
          description="Approved partners, displayed only where a public relationship is recorded."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <li key={partner.id} className="rounded-3xl border border-line bg-white p-6">
                <h3 className="font-display text-lg font-extrabold text-brand">
                  {partner.name}
                </h3>
                {partner.relationshipType ? (
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-leaf-strong">
                    {partner.relationshipType}
                  </p>
                ) : null}
                {partner.description ? (
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {partner.description}
                  </p>
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
      ) : null}

      <section className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="relative isolate overflow-hidden rounded-4xl bg-brand p-8 text-white sm:p-12">
          <p className="relative text-xs font-black uppercase tracking-[0.16em] text-sun">
            Stand with us
          </p>
          <h2 className="relative mt-3 max-w-2xl text-balance text-3xl font-black tracking-tight sm:text-4xl">
            Stand with children who deserve every chance to shine.
          </h2>
          <p className="relative mt-4 max-w-2xl text-white/80">
            Volunteer, partner or give what you can to support inclusive education.{" "}
            <span className="font-display font-black text-sun">We Leave No Child Behind.</span>
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link
              href="/get-involved"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-sun px-7 text-sm font-black text-ink shadow-[0_5px_0_rgb(203_150_0/0.6)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none"
            >
              Get involved
            </Link>
            <Link
              href="/donate"
              className="inline-flex min-h-12 items-center rounded-full border-2 border-white px-7 text-sm font-black text-white transition-colors hover:bg-white/10"
            >
              Donate
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default async function AboutPage() {
  const cmsPage = await getPublicPage("about");
  const [programmes, partners, storyCount] = await Promise.all([
    listProgrammes(),
    listPublicPartners(),
    countPublishedStories(),
  ]);

  // A CMS-managed about page takes precedence. Editors manage the hero title /
  // excerpt and all sections through /admin/pages with slug "about". Images in
  // blocks sections come from the media library.
  if (cmsPage) {
    return (
      <>
        <PageHero
          eyebrow="About ISNESI"
          title={cmsPage.title}
          description={cmsPage.excerpt ?? undefined}
        />
        <Section>
          {cmsPage.sections.length > 0 ? (
            <div className="grid gap-10">
              <PageSections sections={cmsPage.sections} />
            </div>
          ) : null}
        </Section>
        <AboutDynamicLists programmes={programmes} partners={partners} storyCount={storyCount} />
      </>
    );
  }

  // No CMS about page configured yet. Render the original designed view.
  return (
    <DefaultAboutContent
      programmes={programmes}
      partners={partners}
      storyCount={storyCount}
    />
  );
}
