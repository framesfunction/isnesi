import { ArrowRight, Baby, Check, Download, Gamepad2, Sparkles, Video } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/public/page-hero";
import { KidsPlayingIllustration } from "@/components/public/home-art";
import type { PublicKidsResource } from "@/features/kids/queries";
import type { KidsResourceType } from "@/types/database";

/**
 * Designed Kids' Corner sections.
 *
 * Playful but safe: the page keeps its calm edge for grown-ups in the hero and
 * review notes, while the resource cards carry the brand's lighter side — one
 * card recipe, one chip shape, colour carried by the resource type.
 */

const LABELS: Record<KidsResourceType, string> = {
  story: "Story",
  activity: "Activity",
  game: "Game",
  video: "Video",
  download: "Download",
};

const ICONS: Record<KidsResourceType, typeof Sparkles> = {
  story: Sparkles,
  activity: Baby,
  game: Gamepad2,
  video: Video,
  download: Download,
};

/** One chip shape; the tone comes from the resource type, like story chips. */
const TYPE_CHIP: Record<KidsResourceType, string> = {
  story: "bg-leaf-soft text-leaf-strong",
  activity: "bg-brand-soft text-brand",
  game: "bg-coral/15 text-coral-strong",
  video: "bg-sun-soft text-ink",
  download: "bg-cream text-ink-muted ring-1 ring-line",
};

/** Decorative header art: two background tones and one accent per type. */
const TYPE_ART: Record<KidsResourceType, { field: string; a: string; b: string }> = {
  story: { field: "bg-leaf-soft", a: "bg-leaf/30", b: "bg-sun/70" },
  activity: { field: "bg-brand-soft", a: "bg-brand/20", b: "bg-sun/70" },
  game: { field: "bg-coral/15", a: "bg-coral/30", b: "bg-sun/80" },
  video: { field: "bg-sun-soft", a: "bg-sun/60", b: "bg-leaf/25" },
  download: { field: "bg-cream", a: "bg-brand/10", b: "bg-sun/50" },
};

/** Age label built only from recorded values; no defaults are invented. */
function ageLabel(resource: { minAge: number | null; maxAge: number | null }): string {
  if (resource.minAge !== null && resource.maxAge !== null) {
    return `Ages ${resource.minAge}–${resource.maxAge}`;
  }
  if (resource.minAge !== null) return `Ages ${resource.minAge}+`;
  return `Up to age ${resource.maxAge}`;
}

/** One resource card, shared treatment with the site's signature card. */
export function KidsResourceCard({ resource }: { resource: PublicKidsResource }) {
  const Icon = ICONS[resource.resourceType];
  const art = TYPE_ART[resource.resourceType];

  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1">
      <div aria-hidden="true" className={`relative h-32 overflow-hidden ${art.field}`}>
        <div className={`absolute -bottom-10 -left-6 size-28 rounded-full transition-transform group-hover:scale-110 ${art.a}`} />
        <div className={`absolute right-6 top-6 size-16 rounded-full ${art.b}`} />
        <div
          className={`absolute bottom-6 right-14 h-16 w-24 rotate-[-8deg] rounded-3xl border-8 border-white/70`}
        />
        <span className="absolute bottom-4 left-5 grid size-10 place-items-center rounded-xl bg-white/90 shadow-sm">
          <Icon aria-hidden="true" className="size-5 text-brand" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${TYPE_CHIP[resource.resourceType]}`}
          >
            {LABELS[resource.resourceType]}
          </span>
          {resource.minAge !== null || resource.maxAge !== null ? (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              {ageLabel(resource)}
            </span>
          ) : null}
          {resource.featured ? (
            <span className="rounded-full bg-sun-soft px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink">
              Favourite
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 font-display text-lg font-black text-brand">{resource.title}</h3>
        {resource.description ? (
          <p className="mt-2 text-sm leading-6 text-ink-muted">{resource.description}</p>
        ) : null}
      </div>
    </li>
  );
}

const REVIEW_STEPS = [
  {
    title: "Written for children",
    body: "Every entry chooses gentle words, honest pictures and clear instructions for young readers.",
  },
  {
    title: "Reviewed for child safety",
    body: "A staff member checks content, links and interactions before anything can be published.",
  },
  {
    title: "Published only when cleared",
    body: "A resource cannot appear here without a recorded safeguarding approval — by design, not by promise.",
  },
];

/** How the collection is kept safe, with the brand illustration as the welcome. */
export function KidsSafetyBand() {
  return (
    <Section
      title="A safe corner, by design"
      description="Children play first and ask questions later. The reviewing is our job, not theirs."
      className="border-y border-line/70 bg-sun-soft"
    >
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <ol className="grid gap-4">
          {REVIEW_STEPS.map(({ title, body }, index) => (
            <li
              key={title}
              className="relative flex items-start gap-4 rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)]"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded-full bg-leaf-strong text-white"
              >
                <Check className="size-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-extrabold text-brand">
                  <span className="sr-only">{`Step ${index + 1}: `}</span>
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-2 rounded-[2rem] bg-sun/60" />
          <KidsPlayingIllustration className="relative w-full rounded-[1.75rem] bg-white p-6 shadow-md" />
        </div>
      </div>
    </Section>
  );
}

/** Closing note for grown-ups, before the page's call to action. */
export function KidsGrownUpNote() {
  return (
    <Section
      title="For grown-ups"
      description="The Kids' Corner is for children; this website is how their adults find us."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/programmes"
          className="group rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1"
        >
          <h3 className="font-display text-lg font-black text-brand">See the programmes</h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Learn how inclusive education work reaches classrooms, families and communities.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand">
            Explore programmes
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
        <Link
          href="/contact"
          className="group rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1"
        >
          <h3 className="font-display text-lg font-black text-brand">Suggest or ask about a resource</h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Ideas and questions are welcome — a staff member reads every message.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand">
            Contact the team
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
      </div>
    </Section>
  );
}
