import type { Metadata } from "next";

import { PageHero, Section } from "@/components/public/page-hero";
import { StoryCard } from "@/components/public/story-card";
import { listPublishedStories } from "@/features/editorial/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Stories & News",
  description:
    "Stories, news and updates from ISNESI programmes, published after editorial and safeguarding review.",
};

export default async function StoriesPage() {
  const stories = await listPublishedStories({ limit: 24 });

  return (
    <>
      <PageHero
        eyebrow="Stories & news"
        title="Real change, told by the people behind it"
        description="Every story is reviewed by an editor before publication. Stories involving children also require recorded safeguarding clearance."
      />

      <Section>
        {stories.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white p-8">
            <h2 className="text-xl font-black text-brand">Nothing published yet</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Stories and news appear here once they have been created, reviewed and published from
              the editorial module. Drafts are never visible to visitors.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}