import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { storyTypeChip, storyTypeLabel } from "@/features/editorial/helpers";
import type { StorySummary } from "@/features/editorial/queries";
import { formatDate } from "@/lib/format";

/**
 * Summary card for a published story or news item.
 *
 * One card treatment shared by the home page, the stories index and the related
 * list on a detail page, so a story looks the same everywhere. The decorative
 * header changes tone with the content type, mirroring the chip colours.
 */

/** Decorative header art: one field and two accents per content type. */
const TYPE_ART: Record<string, { field: string; a: string; b: string; c: string }> = {
  story: { field: "bg-brand-soft", a: "bg-leaf/25", b: "bg-sun/80", c: "border-brand/10" },
  news: { field: "bg-leaf-soft", a: "bg-brand/15", b: "bg-sun/80", c: "border-leaf-strong/20" },
  announcement: { field: "bg-sun-soft", a: "bg-coral/25", b: "bg-leaf/25", c: "border-sun" },
  policy: { field: "bg-cream", a: "bg-brand/10", b: "bg-sun/50", c: "border-line" },
};

const FALLBACK_ART = TYPE_ART.story;

/**
 * The title is the card's only link; a stretched pseudo-element makes the whole
 * card clickable, so screen readers meet one link where sighted users see one
 * affordance.
 */
export function StoryCard({ story }: { story: StorySummary }) {
  const href = `/stories/${story.slug}`;
  const art = TYPE_ART[story.contentType] ?? FALLBACK_ART;

  return (
    <li className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1">
      <div aria-hidden="true" className={`relative h-40 overflow-hidden ${art.field}`}>
        <div className={`absolute -bottom-12 -left-8 size-36 rounded-full transition-transform group-hover:scale-110 ${art.a}`} />
        <div className={`absolute right-7 top-7 size-20 rounded-full ${art.b}`} />
        <div className={`absolute bottom-8 right-8 h-24 w-32 rotate-[-8deg] rounded-4xl border-12 ${art.c}`} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${storyTypeChip(story.contentType)}`}
          >
            {storyTypeLabel(story.contentType)}
          </span>
          {story.featured ? (
            <span className="rounded-full bg-sun-soft px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink">
              Featured
            </span>
          ) : null}
        </div>
        <h3 className="mt-4 font-display text-lg font-extrabold leading-snug text-brand">
          <Link
            href={href}
            className="rounded hover:text-leaf-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand after:absolute after:inset-0 after:rounded-[1.75rem]"
          >
            {story.title}
          </Link>
        </h3>
        {story.excerpt ? (
          <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">{story.excerpt}</p>
        ) : (
          <span className="flex-1" />
        )}
        <p className="mt-4 text-xs font-semibold text-ink-muted">
          <time dateTime={story.publishedAt ?? undefined}>{formatDate(story.publishedAt)}</time>
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand">
          Read story
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </li>
  );
}
