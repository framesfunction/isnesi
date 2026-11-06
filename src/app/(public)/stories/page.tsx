import type { Metadata } from "next";

import { parsePageParam, StoriesIndex } from "@/components/public/stories-index";

export const revalidate = 300;

const DESCRIPTION =
  "Stories, news and updates from ISNESI programmes, published after editorial and safeguarding review.";

export const metadata: Metadata = {
  title: "Stories & news",
  description: DESCRIPTION,
  alternates: { canonical: "/stories" },
  openGraph: { type: "website", title: "Stories & News", description: DESCRIPTION, url: "/stories" },
  twitter: { card: "summary", title: "Stories & News", description: DESCRIPTION },
};

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <StoriesIndex active={null} pageParam={parsePageParam(page)} />;
}
