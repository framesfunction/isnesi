import type { MetadataRoute } from "next";

import { STORY_TYPES } from "@/features/editorial/helpers";
import { listPublishedStories } from "@/features/editorial/queries";
import { listPublishedPageLinks } from "@/features/pages/queries";
import { publicNavigation } from "@/lib/site";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Public sitemap.
 *
 * Contains the stable public routes, every published story and news item, the
 * four story type indexes, plus any additional published page that is flagged
 * for navigation. Regenerated hourly so newly published content appears without
 * a redeploy.
 *
 * The admin application is never listed.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...publicNavigation.map((item) => ({
      url: `${base}${item.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${base}/kids-corner`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const [publishedPages, stories] = await Promise.all([
    listPublishedPageLinks(),
    listPublishedStories({ limit: 500 }),
  ]);

  // Type-filtered story indexes, so every filter state is discoverable.
  const storyTypeEntries: MetadataRoute.Sitemap = STORY_TYPES.map((type) => ({
    url: `${base}/stories/type/${type}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Every published story and news item, with its real last-updated date.
  const storyEntries: MetadataRoute.Sitemap = stories.map((story) => ({
    url: `${base}/stories/${story.slug}`,
    lastModified: new Date(story.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const known = new Set(
    [...staticEntries, ...storyTypeEntries, ...storyEntries].map((entry) => entry.url),
  );

  const cmsEntries: MetadataRoute.Sitemap = publishedPages
    .map((page) => `${base}/${page.slug.replace(/^\/+/, "")}`)
    .filter((url) => !known.has(url))
    .map((url) => ({
      url,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...staticEntries, ...storyTypeEntries, ...storyEntries, ...cmsEntries];
}