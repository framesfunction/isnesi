import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentBlocks } from "@/components/public/content-blocks";
import { storyTypeLabel } from "@/components/public/story-card";
import { getPublishedStoryBySlug } from "@/features/editorial/queries";
import { formatDate } from "@/lib/format";

export const revalidate = 300;

type StoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) {
    return { title: "Story not found" };
  }

  return {
    title: story.title,
    description: story.seoDescription ?? story.excerpt ?? undefined,
    openGraph: {
      type: "article",
      title: story.title,
      description: story.seoDescription ?? story.excerpt ?? undefined,
      publishedTime: story.publishedAt ?? undefined,
    },
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link href="/stories" className="font-semibold text-brand hover:underline">
          ← All stories
        </Link>
      </nav>

      <p className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.14em]">
        <span className="rounded-full bg-leaf-soft px-3 py-1 text-leaf">
          {storyTypeLabel(story.contentType)}
        </span>
        <time dateTime={story.publishedAt ?? undefined} className="text-ink-muted">
          {formatDate(story.publishedAt)}
        </time>
      </p>

      <h1 className="mt-4 text-balance text-4xl font-black leading-[1.1] tracking-tight text-brand sm:text-5xl">
        {story.title}
      </h1>

      {story.excerpt ? <p className="mt-5 text-lg text-ink-muted">{story.excerpt}</p> : null}

      <div className="mt-10">
        <ContentBlocks body={story.body} />
      </div>

      {!story.body ||
      (typeof story.body === "object" && Object.keys(story.body).length === 0) ? (
        <p className="mt-10 rounded-2xl border-2 border-dashed border-line bg-white p-6 text-sm text-ink-muted">
          This story has been published with a summary only. The full body is added in the editorial
          module.
        </p>
      ) : null}
    </article>
  );
}