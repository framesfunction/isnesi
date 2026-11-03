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
    <li className="flex h-full flex-col rounded-3xl border-2 border-line bg-white p-6">
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
        <Link href={`/stories/${story.slug}`} className="hover:underline">
          {story.title}
        </Link>
      </h3>
      {story.excerpt ? <p className="mt-2 flex-1 text-sm text-ink-muted">{story.excerpt}</p> : null}
      <p className="mt-4 text-xs font-semibold text-ink-muted">
        <time dateTime={story.publishedAt ?? undefined}>{formatDate(story.publishedAt)}</time>
      </p>
    </li>
  );
}