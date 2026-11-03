import type { MetadataRoute } from "next";

import { listPublishedPageLinks } from "@/features/pages/queries";
import { publicNavigation } from "@/lib/site";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Public sitemap.
 *
 * Contains the stable public routes plus any additional published page that is
 * flagged for navigation. Regenerated hourly so newly published CMS pages appear
 * without a redeploy.
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

  const publishedPages = await listPublishedPageLinks();
  const known = new Set(staticEntries.map((entry) => entry.url));

  const cmsEntries: MetadataRoute.Sitemap = publishedPages
    .map((page) => `${base}/${page.slug.replace(/^\/+/, "")}`)
    .filter((url) => !known.has(url))
    .map((url) => ({
      url,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...staticEntries, ...cmsEntries];
}