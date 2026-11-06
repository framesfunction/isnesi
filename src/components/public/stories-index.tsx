import Link from "next/link";

import { CtaBand } from "@/components/public/cta-band";
import { EmptyNote } from "@/components/public/empty-note";
import { PageHero, Section } from "@/components/public/page-hero";
import { PageSections } from "@/components/public/page-sections";
import { PublicPagination } from "@/components/public/pagination";
import { StoryCard } from "@/components/public/story-card";
import { FeaturedStory, StoryFilters } from "@/components/public/stories-content";
import { storyTypePlural } from "@/features/editorial/helpers";
import { countPublishedStoriesByType, listPublishedStories } from "@/features/editorial/queries";
import { getPublicPage } from "@/features/pages/queries";
import type { ContentType } from "@/types/database";

/**
 * The Stories & News index, shared by both public routes.
 *
 * `/stories` renders every published item; `/stories/type/[type]` renders one
 * type. The filter lives in the URL path (not a query string) and the page
 * number in `?page=`, so every list state is a shareable address. Page one is
 * statically generated; deeper pages render on demand.
 */

const PAGE_SIZE = 12;

/** Greater of one and the page number in a `?page=` value; garbage is page one. */
export function parsePageParam(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 1000);
}

export async function StoriesIndex({
  active,
  pageParam = 1,
}: {
  active: ContentType | null;
  /** Raw `?page=` value; clamped here so callers never double-fetch. */
  pageParam?: number;
}) {
  const [cmsPage, counts, firstPageStories] = await Promise.all([
    getPublicPage("stories"),
    countPublishedStoriesByType(),
    listPublishedStories({ limit: PAGE_SIZE, contentType: active ?? undefined }),
  ]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const perTypeTotal = active ? (counts[active] ?? 0) : total;
  const totalPages = Math.max(1, Math.ceil(perTypeTotal / PAGE_SIZE));
  const page = Math.min(Math.max(1, pageParam), totalPages);

  // The primary fetch is always page one; only a clamped, non-first page needs
  // a second read, so an out-of-range `?page=` (or the default) costs nothing.
  const stories =
    page === 1
      ? firstPageStories
      : await listPublishedStories({
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          contentType: active ?? undefined,
        });

  const featured =
    active === null && page === 1 ? (stories.find((story) => story.featured) ?? null) : null;
  const gridStories = featured
    ? stories.filter((story) => story.id !== featured.id)
    : stories;

  const baseHref = active ? `/stories/type/${active}` : "/stories";
  const hrefFor = (pageNumber: number) =>
    pageNumber > 1 ? `${baseHref}?page=${pageNumber}` : baseHref;

  const rangeStart = perTypeTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, perTypeTotal);
  const range = perTypeTotal > 0 ? `${rangeStart}–${rangeEnd}` : "0";
  const countLabel = `Showing ${range} of ${perTypeTotal} published item${perTypeTotal === 1 ? "" : "s"}.`;

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Stories & News", href: "/stories" },
    ...(active ? [{ label: storyTypePlural(active) }] : []),
  ];

  return (
    <>
      <PageHero
        eyebrow="Stories & news"
        title={active ? storyTypePlural(active) : "Real change, told by the people behind it"}
        description="Every story and update is reviewed by an editor before publication. Stories involving children also require recorded safeguarding clearance."
        breadcrumb={breadcrumb}
      />

      {cmsPage && cmsPage.sections.length > 0 ? (
        <Section>
          <PageSections sections={cmsPage.sections} />
        </Section>
      ) : null}

      {featured ? <FeaturedStory story={featured} /> : null}

      <Section
        title="All stories & news"
        description={
          active
            ? `Showing ${storyTypePlural(active).toLowerCase()} only — ${countLabel}`
            : `Everything published, newest first — ${countLabel}`
        }
      >
        <div className="mb-8">
          <StoryFilters active={active} counts={counts} />
        </div>

        {gridStories.length === 0 ? (
          active ? (
            <EmptyNote title={`No ${storyTypePlural(active).toLowerCase()} published yet`}>
              Nothing of this type has been published so far.{" "}
              <Link href="/stories" className="font-bold text-brand hover:underline">
                View all stories &amp; news
              </Link>
            </EmptyNote>
          ) : (
            <EmptyNote title="Nothing published yet">
              Stories and news appear here once an editor has published them after review. Drafts are
              never visible to visitors.
            </EmptyNote>
          )
        ) : (
          <>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {gridStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </ul>
            <PublicPagination
              page={page}
              totalPages={totalPages}
              href={hrefFor}
              label="Stories pages"
            />
          </>
        )}
      </Section>

      <CtaBand
        eyebrow="Be part of the next story"
        title="Help us keep telling what is real."
        description="Volunteer, partner or give what you can to support inclusive education."
        actions={[
          { label: "Get involved", href: "/get-involved", emphasis: "primary" },
          { label: "Donate", href: "/donate", emphasis: "secondary" },
        ]}
      />
    </>
  );
}
