import Link from "next/link";

import type { StorySummary } from "@/features/editorial/queries";
import { formatDate } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  story: "Story",
  news: "News",
  announcement: "Announcement",
  policy: "Policy",
};

export function storyTypeLabel(contentType: string): string {
  return TYPE_LABELS[contentType] ?? "Update";
}

/** Summary card for a published story or news item. */
export function StoryCard({ story }: { story: StorySummary }) {
  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_12px_40px_rgba(24,36,67,0.06)]">
      <div aria-hidden="true" className="relative h-44 overflow-hidden bg-brand-soft">
        <div className="absolute -bottom-12 -left-8 size-36 rounded-full bg-leaf/25" />
        <div className="absolute right-7 top-7 size-20 rounded-full bg-sun/80" />
        <div className="absolute bottom-8 right-8 h-24 w-32 rotate-[-8deg] rounded-[2rem] border-[12px] border-brand/10" />
      </div>
      <div className="flex flex-1 flex-col p-6">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-leaf-soft px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-leaf">
          {storyTypeLabel(story.contentType)}
        </span>
        {story.featured ? (
          <span className="rounded-full bg-sun-soft px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink">
            Featured
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-lg font-extrabold leading-snug text-brand">
        <Link href={`/stories/${story.slug}`} className="group-hover:text-leaf">
          {story.title}
        </Link>
      </h3>
      {story.excerpt ? <p className="mt-2 flex-1 text-sm text-ink-muted">{story.excerpt}</p> : null}
      <p className="mt-4 text-xs font-semibold text-ink-muted">
        <time dateTime={story.publishedAt ?? undefined}>{formatDate(story.publishedAt)}</time>
      </p>
      <Link href={`/stories/${story.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand">
        Read story <span aria-hidden="true">→</span>
      </Link>
      </div>
    </li>
  );
}