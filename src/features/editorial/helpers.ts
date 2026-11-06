/**
 * Pure support code for the public Stories & News pages.
 *
 * Kept free of network access so the three rules that matter can be unit
 * tested: how a content type is labelled, how long a piece reads, and the
 * structured data a story exposes to search engines.
 */

import { extractBlocks } from "@/lib/validation/blocks";
import type { ContentType, Json } from "@/types/database";

export const STORY_TYPES = ["story", "news", "announcement", "policy"] as const;

export const STORY_TYPE_LABELS: Record<ContentType, string> = {
  story: "Story",
  news: "News",
  announcement: "Announcement",
  policy: "Policy",
};

/** One chip shape; only the tone changes per content type. */
export const STORY_TYPE_CHIP: Record<ContentType, string> = {
  story: "bg-leaf-soft text-leaf-strong",
  news: "bg-brand-soft text-brand",
  announcement: "bg-sun-soft text-ink",
  policy: "bg-cream text-ink-muted ring-1 ring-line",
};

const FALLBACK_CHIP = "bg-cream text-ink-muted ring-1 ring-line";

export function isStoryType(value: string): value is ContentType {
  return (STORY_TYPES as readonly string[]).includes(value);
}

export function storyTypeLabel(value: string): string {
  return isStoryType(value) ? STORY_TYPE_LABELS[value] : "Update";
}

export function storyTypeChip(value: string): string {
  return isStoryType(value) ? STORY_TYPE_CHIP[value] : FALLBACK_CHIP;
}

/** Plural labels for a type-specific index heading and page title. */
export const STORY_TYPE_PLURALS: Record<ContentType, string> = {
  story: "Stories",
  news: "News",
  announcement: "Announcements",
  policy: "Policies",
};

export function storyTypePlural(value: string): string {
  return isStoryType(value) ? STORY_TYPE_PLURALS[value] : "Stories";
}

/** Filter options in a fixed order, so the filter bar never reshuffles. */
export function storyTypeOptions(): { value: ContentType; label: string }[] {
  return STORY_TYPES.map((value) => ({ value, label: STORY_TYPE_LABELS[value] }));
}

const WORDS_PER_MINUTE = 200;

function countWordsInText(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Count words across the whole block vocabulary the public renderer supports. */
function countWords(body: Json): number {
  const blocks = extractBlocks(body) ?? [];
  let words = 0;

  for (const raw of blocks) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const block = raw as { text?: unknown; items?: unknown };

    if (typeof block.text === "string") words += countWordsInText(block.text);
    if (Array.isArray(block.items)) {
      for (const item of block.items) {
        if (typeof item === "string") words += countWordsInText(item);
      }
    }
  }

  return words;
}

/**
 * Reading time in whole minutes. Always at least one, so a short notice never
 * advertises "0 min read".
 */
export function estimateReadingMinutes(body: Json): number {
  const words = countWords(body);
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export type StoryJsonLdInput = {
  baseUrl: string;
  path: string;
  headline: string;
  description: string | null;
  datePublished: string | null;
  dateModified: string | null;
  contentType: ContentType;
  siteName: string;
};

/** schema.org type per content type: news and announcements are `NewsArticle`. */
export function schemaTypeFor(contentType: ContentType): "NewsArticle" | "Article" {
  return contentType === "news" || contentType === "announcement" ? "NewsArticle" : "Article";
}

/**
 * JSON-LD for a story: the article plus a `BreadcrumbList` matching the page
 * breadcrumb. Optional values are omitted rather than emitted as `null`.
 */
export function buildStoryJsonLd(input: StoryJsonLdInput): Record<string, unknown>[] {
  const base = input.baseUrl.trim().replace(/\/+$/, "");
  const url = `${base}${input.path}`;

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaTypeFor(input.contentType),
    headline: input.headline,
    url,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    publisher: { "@type": "Organization", name: input.siteName },
  };

  if (input.description) article.description = input.description;
  if (input.datePublished) article.datePublished = input.datePublished;
  if (input.dateModified) article.dateModified = input.dateModified;

  return [
    article,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Stories & News", item: `${base}/stories` },
        { "@type": "ListItem", position: 3, name: input.headline, item: url },
      ],
    },
  ];
}
