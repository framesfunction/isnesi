import type { Metadata } from "next";

import { PageHero, Section } from "@/components/public/page-hero";
import { listKidsResources } from "@/features/kids/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kids' Corner",
  description:
    "Age-appropriate stories, activities and learning resources for children, reviewed for child safety before publication.",
};

const TYPE_LABELS: Record<string, string> = {
  story: "Story",
  activity: "Activity",
  game: "Game",
  video: "Video",
  download: "Download",
};

export default async function KidsCornerPage() {
  const resources = await listKidsResources();

  return (
    <>
      <PageHero
        eyebrow="Kids' Corner"
        title="Learn, play and explore"
        description="Every resource here passed a child-safety review before it was published."
      />

      <Section>
        {resources.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-line bg-white p-8">
            <h2 className="text-xl font-black text-brand">No resources published yet</h2>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Resources only appear here once they are published <strong>and</strong> marked as
              safeguarding-approved. A resource cannot bypass that review, by design.
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <li key={resource.id} className="rounded-3xl border-2 border-line bg-white p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sun-soft px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink">
                    {TYPE_LABELS[resource.resourceType] ?? resource.resourceType}
                  </span>
                  {resource.minAge !== null || resource.maxAge !== null ? (
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                      Ages {resource.minAge ?? "3"}–{resource.maxAge ?? "12"}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 font-display text-lg font-extrabold text-brand">
                  {resource.title}
                </h2>
                {resource.description ? (
                  <p className="mt-2 text-sm text-ink-muted">{resource.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}