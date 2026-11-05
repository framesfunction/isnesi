// app/(public)/page.tsx
import {
  ArrowRight,
  BookOpen,
  HandHeart,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { NewsletterForm } from "@/components/public/newsletter-form";
import { GrowingBookIllustration, KidsPlayingIllustration } from "@/components/public/home-art";
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

const waysToHelp = [
  {
    href: "/get-involved",
    title: "Volunteer your time",
    body: "Share skills, energy or expertise with children, educators and families.",
    tone: "bg-white text-brand",
    chip: "bg-brand-soft text-brand",
    icon: HandHeart,
  },
  {
    href: "/get-involved",
    title: "Partner with us",
    body: "Schools, NGOs, OPDs and businesses co-deliver inclusion that lasts.",
    tone: "bg-leaf text-white",
    chip: "bg-white/15 text-white",
    icon: HeartHandshake,
  },
  {
    href: "/donate",
    title: "Give what you can",
    body: "Every contribution opens a door: books, transport, therapy, access.",
    tone: "bg-sun text-ink",
    chip: "bg-white/25 text-ink",
    icon: Sparkles,
  },
];

export default async function HomePage() {
  const [programmes, stories, partners] = await Promise.all([
    listProgrammes(),
    listPublishedStories({ limit: 3 }),
    listPublicPartners(),
  ]);

  const stats = [
    { value: `${programmes.length}`, label: "Active programmes" },
    { value: `${partners.length}`, label: "Approved partners" },
    { value: "0", label: "Children left behind" },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-cream">
        <div aria-hidden="true" className="absolute -left-36 top-16 size-80 rounded-full bg-brand-soft" />
        <div aria-hidden="true" className="absolute -right-32 -top-24 size-96 rounded-full bg-brand-soft/80" />
        <div aria-hidden="true" className="absolute -right-16 top-24 size-72 rounded-full bg-sun-soft" />
        <div aria-hidden="true" className="absolute bottom-[-4rem] left-1/3 size-64 rounded-full bg-leaf-soft" />
        <p aria-hidden="true" className="absolute left-6 top-2 select-none text-6xl font-black text-sun/60">
          ✳
        </p>
        <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 pb-10 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand shadow-sm">
              <Sparkles aria-hidden="true" className="size-4 text-leaf" />
              A brighter, more inclusive tomorrow
            </p>
            <h1 className="mt-6 text-balance font-display text-5xl font-black leading-[1.04] tracking-tight text-brand sm:text-6xl">
              Every child can{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="absolute -inset-x-1 bottom-1.5 -z-10 h-5 rounded-full bg-sun sm:h-7"
                />
                belong.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
              We help make learning welcoming and accessible for children with disabilities and
              other vulnerable children, alongside their families, schools and communities.
              Because every child deserves the chance to shine.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/programmes"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-7 text-sm font-black text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Explore our work
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/get-involved"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-brand bg-white px-7 text-sm font-black text-brand shadow-[0_4px_0_rgb(27_63_160/0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Be part of it
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="font-display text-lg font-black text-ink">{siteConfig.tagline}</p>
              <span aria-hidden="true" className="size-1.5 rounded-full bg-coral" />
              <p className="text-sm font-semibold italic text-ink-muted">
                Disability is part of human diversity.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rotate-3 rounded-[2.5rem] border-[3px] border-dashed border-sun"
            />
            <div className="relative overflow-hidden rounded-[2.25rem] border border-line bg-white p-8 shadow-[0_30px_80px_rgba(27,63,160,0.16)]">
              <GrowingBookIllustration className="w-full" />
              <p className="mt-4 max-w-xs font-display text-2xl font-black leading-snug text-brand">
                Every barrier removed is a child moving forward.
              </p>
            </div>
            <p className="absolute -left-3 top-24 -rotate-6 rounded-2xl bg-sun px-4 py-2.5 text-center text-sm font-black leading-snug text-ink shadow-md">
              Big dreams
              <br />
              belong here!
            </p>
            <p className="absolute -bottom-5 right-4 rotate-2 rounded-2xl bg-leaf px-4 py-2.5 text-center text-sm font-black text-white shadow-md">
              Everyone is welcome 🌍
            </p>
            <p
              aria-hidden="true"
              className="absolute -right-4 top-6 grid size-14 place-items-center rounded-full bg-coral text-2xl shadow-md"
            >
              👋
            </p>
          </div>
        </div>

        <div className="relative border-t border-line bg-white/70 backdrop-blur">
          <dl className="mx-auto grid w-full max-w-6xl gap-px overflow-hidden px-5 py-8 sm:grid-cols-3">
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
          <p className="mx-auto w-full max-w-6xl px-5 pb-6 text-center text-xs text-ink-muted">
            Counts reflect what is published on this website today, not projections.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="relative overflow-hidden rounded-[2rem] bg-leaf-soft p-8">
            <div aria-hidden="true" className="absolute -bottom-8 -right-8 size-40 rounded-full bg-sun/60" />
            <div aria-hidden="true" className="absolute -left-6 top-10 size-16 rounded-full bg-white" />
            <HeartHandshake aria-hidden="true" className="relative size-14 text-leaf" />
            <p className="relative mt-14 font-display text-3xl font-black leading-tight text-brand">
              Hello, we&apos;re ISNESI. We make room for every child to grow.
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf">Who we are</p>
            <h2 className="mt-3 text-balance text-3xl font-black tracking-tight text-brand sm:text-4xl">
              Inclusion is built with communities, not delivered to them.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              ISNESI works with children, families, educators and communities to build a more
              inclusive society. We focus on strengths, remove barriers and make participation
              possible, keeping each child&apos;s dignity at the centre.
            </p>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              <li className="rounded-3xl border border-line bg-white p-6 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-leaf">
                  Our vision
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  An inclusive, equitable society where every child and person with a disability
                  has equal access to quality education, opportunity, dignity and full
                  participation in community life.
                </p>
              </li>
              <li className="rounded-3xl border border-line bg-white p-6 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-coral">
                  Our mission
                </h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Promote inclusive and special needs education through innovative, accessible and
                  community-driven solutions that help children with disabilities and other
                  vulnerable children learn, thrive and participate fully.
                </p>
              </li>
            </ul>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 font-black text-brand">
              More about us <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <Section
        title="What we do"
        description="Connected areas of action that help children learn, participate and thrive."
        action={
          <Link
            href="/programmes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
          >
            All programmes <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      >
        {programmes.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-line bg-white p-6 text-sm text-ink-muted">
            Programme information will appear here as soon as published programmes are available.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme, index) => (
              <li
                key={programme.id}
                className="group relative flex min-h-64 flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1"
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-6 -top-6 size-20 rounded-full bg-brand-soft transition-colors group-hover:bg-brand"
                />
                <div className="relative flex items-center gap-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun-soft text-2xl leading-none shadow-sm">
                    {programme.icon ?? programme.title.charAt(0)}
                  </span>
                  <span className="font-display text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-black text-brand">{programme.title}</h3>
                {programme.summary ? (
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{programme.summary}</p>
                ) : null}
                <Link
                  href={`/programmes#${programme.key}`}
                  className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-brand"
                >
                  Learn more{" "}
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

      <section className="bg-brand text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sun">
              Your support in action
            </p>
            <h2 className="mt-3 text-balance text-3xl font-black sm:text-4xl">
              Every contribution helps open a door.
            </h2>
            <p className="mt-4 max-w-lg text-white/80">
              Donations strengthen inclusive learning, practical support for children and
              families, and community-led solutions. Time, partnership and funding all count.
            </p>
            <Link
              href="/donate"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-sun px-7 text-sm font-black text-ink shadow-[0_5px_0_rgb(163_90_0/0.6)] transition-transform hover:-translate-y-0.5"
            >
              Make a difference 🧡
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {waysToHelp.map((item) => {
              const WayIcon = item.icon;
              return (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className={`flex h-full flex-col rounded-3xl p-6 transition-transform hover:-translate-y-1 ${item.tone}`}
                  >
                    <span className={`grid w-fit place-items-center rounded-full px-3.5 py-2 ${item.chip}`}>
                      <WayIcon aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 opacity-90">{item.body}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-sun-soft">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_0.85fr] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">
              A little space for big imaginations
            </p>
            <h2 className="mt-3 text-balance text-3xl font-black tracking-tight text-brand sm:text-4xl">
              Welcome to the Kids&apos; Corner!
            </h2>
            <p className="mt-4 max-w-xl text-lg text-ink-muted">
              Stories, creative activities and learning games about friendship, kindness and
              inclusion, in a space made for children and reviewed for child safety.
            </p>
            <Link
              href="/kids-corner"
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-7 text-sm font-black text-white shadow-[0_5px_0_rgb(196_62_70/0.7)] transition-transform hover:-translate-y-0.5"
            >
              Learn · Play · Belong <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-2 rounded-[2rem] bg-sun/60" />
            <KidsPlayingIllustration className="relative w-full rounded-[1.75rem] bg-white p-6 shadow-md" />
          </div>
        </div>
      </section>

      <Section
        title="Stories from our community"
        description="Safeguarding-cleared stories and news from ISNESI communities."
        className="border-y border-line/70 bg-white"
        action={
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
          >
            All stories <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        }
      >
        {stories.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-line bg-cream p-6 text-sm text-ink-muted">
            Safeguarding-cleared stories and news will appear here once an editor publishes them.
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-3">
            {stories.map((story) => <StoryCard key={story.id} story={story} />)}
          </ul>
        )}
      </Section>

      <Section title="How we work" description="A practical, rights-based approach grounded in partnership and accountability.">
        <ul className="grid gap-4 md:grid-cols-3">
          {approach.map((item, index) => {
            const Icon = [BookOpen, Users, ShieldCheck][index];
            return (
              <li key={item.title} className="rounded-3xl border border-line bg-white p-7">
                <span className="inline-grid size-14 place-items-center rounded-2xl bg-brand-soft">
                  <Icon aria-hidden="true" className="size-7 text-brand" />
                </span>
                <h3 className="mt-6 font-display text-xl font-black text-brand">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      {partners.length > 0 ? (
        <Section title="Working in partnership" description="Approved partners, displayed only where a public relationship is recorded.">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => (
              <li key={partner.id} className="grid min-h-32 place-items-center rounded-2xl border border-line bg-white p-5 text-center">
                {partner.websiteUrl ? (
                  <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sm font-bold text-ink hover:text-brand">
                    {partner.logoUrl ? (
                      <Image
                        src={partner.logoUrl}
                        alt=""
                        width={200}
                        height={64}
                        className="mx-auto max-h-16 w-auto max-w-full object-contain"
                      />
                    ) : (
                      partner.name
                    )}
                  </a>
                ) : partner.logoUrl ? (
                  <Image
                    src={partner.logoUrl}
                    alt={`${partner.name} logo`}
                    width={200}
                    height={64}
                    className="max-h-16 w-auto max-w-full object-contain"
                  />
                ) : partner.name}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <section className="mx-auto w-full max-w-6xl px-5 py-14">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-brand p-8 text-white sm:p-12">
          <div aria-hidden="true" className="absolute -left-16 -top-16 size-56 rounded-full border-[24px] border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-20 right-10 size-44 rounded-full bg-sun/20 blur-2xl" />
          <h2 className="relative max-w-2xl text-balance text-3xl font-black tracking-tight sm:text-4xl">
            Every child deserves a place to learn, belong and thrive.
          </h2>
          <p className="relative mt-4 max-w-2xl text-white/80">
            Give your time, expertise or support to stand with ISNESI.{" "}
            <span className="font-display font-black text-sun">{siteConfig.tagline}</span>
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href="/get-involved" className="inline-flex min-h-12 items-center rounded-full bg-sun px-7 text-sm font-black text-ink">
              Volunteer or partner
            </Link>
            <Link href="/donate" className="inline-flex min-h-12 items-center rounded-full border-2 border-white px-7 text-sm font-black text-white">
              Donate
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-leaf-soft">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf">Stay connected</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-brand">Good news in your inbox</h2>
            <p className="mt-3 max-w-xl text-ink-muted">
              Occasional ISNESI updates, stories and opportunities to support inclusive education.
              No noise, unsubscribe anytime.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
