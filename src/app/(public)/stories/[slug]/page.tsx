import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CtaBand } from "@/components/public/cta-band";
import { ContentBlocks } from "@/components/public/content-blocks";
import { RelatedStories, StoryByline, StoryChips } from "@/components/public/stories-content";
import {
  buildStoryJsonLd,
  estimateReadingMinutes,
  storyTypeChip,
  storyTypeLabel,
} from "@/features/editorial/helpers";
import { getPublishedStoryBySlug, listRelatedStories } from "@/features/editorial/queries";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

/** Absolute site origin for structured data; mirrors the root layout helper. */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) {
    return { title: "Story not found" };
  }

  const description = story.seoDescription ?? story.excerpt ?? undefined;

  return {
    title: story.title,
    description,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      type: "article",
      title: story.title,
      description,
      publishedTime: story.publishedAt ?? undefined,
      modifiedTime: story.updatedAt,
      url: `/stories/${story.slug}`,
    },
    twitter: { card: "summary", title: story.title, description },
  };
}

/** Structured data for the article; values are plain strings, never markup. */
function StoryJsonLd({
  data,
  nonce,
}: {
  data: Record<string, unknown>[];
  nonce: string;
}) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function StoryPage({ params }: StoryPageProps) {
  const headersList = await headers();
  const nonce = headersList.get("x-csp-nonce") ?? "";
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) notFound();

  const related = await listRelatedStories({
    contentId: story.id,
    categoryIds: story.categories.map((category) => category.id),
    limit: 3,
  });

  const readingMinutes = estimateReadingMinutes(story.body);
  const bodyIsEmpty =
    !story.body ||
    (typeof story.body === "object" && Object.keys(story.body).length === 0);

  return (
    <>
      <StoryJsonLd
        data={buildStoryJsonLd({
          baseUrl: siteUrl(),
          path: `/stories/${story.slug}`,
          headline: story.title,
          description: story.seoDescription ?? story.excerpt,
          datePublished: story.publishedAt,
          dateModified: story.updatedAt,
          contentType: story.contentType,
          siteName: siteConfig.name,
        })}
        nonce={nonce}
      />

      <article className="mx-auto w-full max-w-3xl px-5 py-12">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${storyTypeChip(story.contentType)}`}
        >
          {storyTypeLabel(story.contentType)}
        </span>

        <h1 className="mt-4 text-balance text-4xl font-black leading-[1.1] tracking-tight text-brand sm:text-5xl">
          {story.title}
        </h1>

        {story.excerpt ? <p className="mt-5 text-lg leading-8 text-ink-muted">{story.excerpt}</p> : null}

        <StoryByline
          story={story}
          readingMinutes={readingMinutes}
          className="mt-6 border-y border-line py-4"
        />

        <StoryChips categories={story.categories} tags={story.tags} className="mt-5" />

        <div className="mt-10">
          <ContentBlocks body={story.body} />
        </div>

        {bodyIsEmpty ? (
          <p className="mt-10 rounded-2xl border-2 border-dashed border-line bg-white p-6 text-sm text-ink-muted">
            This story has been published with a summary only. The full body is added in the
            editorial module.
          </p>
        ) : null}

        <div className="mt-10">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
          >
            ← All stories &amp; news
          </Link>
        </div>
      </article>

      <RelatedStories stories={related} />

      <CtaBand
        eyebrow="We Leave No Child Behind."
        title="Every story starts with someone who cares."
        description="Your time, or your gift, helps more children learn, belong and thrive."
        actions={[
          { label: "Get involved", href: "/get-involved", emphasis: "primary" },
          { label: "Donate", href: "/donate", emphasis: "secondary" },
        ]}
      />
    </>
  );
}
