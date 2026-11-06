import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { parsePageParam, StoriesIndex } from "@/components/public/stories-index";
import { STORY_TYPES, isStoryType, storyTypePlural } from "@/features/editorial/helpers";

export const revalidate = 300;

/**
 * A type-specific stories index, e.g. `/stories/type/news`.
 *
 * The four known types are generated at build time, so the page is static and
 * served from cache like the rest of the public site. An unknown type is a 404
 * rather than an empty page.
 */
export function generateStaticParams() {
  return STORY_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  if (!isStoryType(type)) return { title: "Stories & News" };

  const title = storyTypePlural(type);
  const description = `${title} published by ISNESI, after editorial and safeguarding review.`;

  return {
    title,
    description,
    alternates: { canonical: `/stories/type/${type}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/stories/type/${type}`,
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function StoriesByTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { type } = await params;
  if (!isStoryType(type)) notFound();

  const { page } = await searchParams;
  return <StoriesIndex active={type} pageParam={parsePageParam(page)} />;
}
