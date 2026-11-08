import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

import { Section } from "@/components/public/page-hero";
import { SectionLink } from "@/components/public/section-link";
import { StoryCard } from "@/components/public/story-card";
import { storyTypeChip, storyTypeLabel, storyTypeOptions } from "@/features/editorial/helpers";
import type { StoryLabel, StorySummary } from "@/features/editorial/queries";
import { formatDate } from "@/lib/format";
import type { ContentType } from "@/types/database";

/**
 * Designed Stories & News sections.
 *
 * The filter bar is a set of real links, so every filter state is a shareable,
 * cacheable URL instead of client-side state. Everything else follows the same
 * card, chip and hover rules used across the public site.
 */

/** Type filter bar: server-rendered links with a live count per type. */
export function StoryFilters({
  active,
  counts,
}: {
  active: ContentType | null;
  counts: Record<ContentType, number>;
}) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return (
    <nav aria-label="Filter by content type" className="flex flex-wrap items-center gap-2">
      <FilterChip href="/stories" active={active === null} count={total} label="All" />
      {storyTypeOptions().map((option) => (
        <FilterChip
          key={option.value}
          href={`/stories/type/${option.value}`}
          active={active === option.value}
          count={counts[option.value] ?? 0}
          label={option.label}
        />
      ))}
    </nav>
  );
}

function FilterChip({
  href,
  active,
  count,
  label,
}: {
  href: string;
  active: boolean;
  count: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={[
        "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors",
        active
          ? "border-brand bg-brand text-white"
          : "border-line bg-white text-ink hover:border-brand hover:text-brand",
      ].join(" ")}
    >
      {label}
      <span className={active ? "text-white/70" : "text-ink-muted"}>{count}</span>
    </Link>
  );
}

/** Published date, and the reading time when the body is available. */
export function StoryByline({
  story,
  readingMinutes,
  className,
}: {
  story: StorySummary;
  readingMinutes?: number;
  className?: string;
}) {
  return (
    <p
      className={[
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-ink-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays aria-hidden="true" className="size-4" />
        <time dateTime={story.publishedAt ?? undefined}>{formatDate(story.publishedAt)}</time>
      </span>
      {readingMinutes ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-4" />
          {readingMinutes} min read
        </span>
      ) : null}
    </p>
  );
}

/** Category and tag chips; renders nothing when a story carries neither. */
export function StoryChips({
  categories,
  tags,
  className,
}: {
  categories: StoryLabel[];
  tags: StoryLabel[];
  className?: string;
}) {
  if (categories.length === 0 && tags.length === 0) return null;

  return (
    <ul className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      {categories.map((category) => (
        <li
          key={`category-${category.id}`}
          className="rounded-full bg-brand-soft px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-brand"
        >
          {category.label}
        </li>
      ))}
      {tags.map((tag) => (
        <li
          key={`tag-${tag.id}`}
          className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-ink-muted ring-1 ring-line"
        >
          #{tag.label}
        </li>
      ))}
    </ul>
  );
}

/** Large spotlight for the featured story. */
export function FeaturedStory({ story }: { story: StorySummary }) {
  return (
    <section aria-labelledby="featured-story-title" className="border-b border-line bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-16">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf-strong">Featured</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div
            aria-hidden="true"
            className="relative order-2 min-h-56 overflow-hidden rounded-4xl border border-line bg-brand-soft lg:order-1 lg:min-h-72"
          >
            <div className="absolute -left-10 -top-10 size-40 rounded-full bg-leaf/20" />
            <div className="absolute right-10 top-10 size-24 rounded-full bg-sun/70" />
            <div className="absolute bottom-6 left-16 h-24 w-40 rotate-[-8deg] rounded-4xl border-12 border-brand/10" />
            <div className="absolute -bottom-16 -right-10 size-48 rounded-full bg-leaf-soft" />
          </div>
          <div className="order-1 lg:order-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${storyTypeChip(story.contentType)}`}
            >
              {storyTypeLabel(story.contentType)}
            </span>
            <h2
              id="featured-story-title"
              className="mt-4 text-balance text-3xl font-black tracking-tight text-brand sm:text-4xl"
            >
              <Link href={`/stories/${story.slug}`} className="hover:text-leaf-strong">
                {story.title}
              </Link>
            </h2>
            {story.excerpt ? (
              <p className="mt-4 text-lg leading-8 text-ink-muted">{story.excerpt}</p>
            ) : null}
            <StoryByline story={story} className="mt-5" />
            <Link
              href={`/stories/${story.slug}`}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-sm font-black text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none"
            >
              Read the story
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Related stories on a detail page. */
export function RelatedStories({ stories }: { stories: StorySummary[] }) {
  if (stories.length === 0) return null;

  return (
    <Section
      title="More from the community"
      description="Other stories and updates published by ISNESI."
      action={<SectionLink href="/stories">All stories</SectionLink>}
    >
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </ul>
    </Section>
  );
}
