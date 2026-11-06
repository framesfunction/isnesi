import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StoryCard } from "@/components/public/story-card";
import type { StorySummary } from "@/features/editorial/queries";

function summary(overrides: Partial<StorySummary> = {}): StorySummary {
  return {
    id: "story-1",
    slug: "a-child-learns",
    contentType: "story",
    featured: false,
    publishedAt: "2025-02-01T00:00:00.000Z",
    updatedAt: "2025-02-02T00:00:00.000Z",
    title: "A child learns",
    excerpt: "In her own words.",
    ...overrides,
  };
}

describe("StoryCard", () => {
  it("exposes exactly one link per card, stretched across the card", () => {
    const html = renderToStaticMarkup(<StoryCard story={summary()} />);

    const anchors = html.match(/<a\b/g) ?? [];
    expect(anchors).toHaveLength(1);
    expect(html).toContain('href="/stories/a-child-learns"');

    // The single link covers the whole card, so the whole tile is the target.
    expect(html).toContain("after:absolute");
    expect(html).toContain("after:inset-0");
  });

  it("keeps the Read story affordance outside the link markup", () => {
    const html = renderToStaticMarkup(<StoryCard story={summary()} />);

    const lastAnchorClose = html.lastIndexOf("</a>");
    expect(lastAnchorClose).toBeGreaterThan(-1);
    expect(html.slice(lastAnchorClose)).toContain("Read story");
  });

  it("renders the featured chip only when recorded", () => {
    const plain = renderToStaticMarkup(<StoryCard story={summary()} />);
    expect(plain).not.toContain("Featured");

    const featured = renderToStaticMarkup(<StoryCard story={summary({ featured: true })} />);
    expect(featured).toContain("Featured");
  });

  it("tones the decorative header art by content type", () => {
    const fields: Record<string, string> = {
      story: "bg-brand-soft",
      news: "bg-leaf-soft",
      announcement: "bg-sun-soft",
      policy: "bg-cream",
    };

    for (const [contentType, field] of Object.entries(fields)) {
      const html = renderToStaticMarkup(
        <StoryCard story={summary({ contentType: contentType as StorySummary["contentType"] })} />,
      );
      expect(html).toContain(field);
    }
  });

  it("falls back to the story treatment for unknown content types", () => {
    const html = renderToStaticMarkup(
      <StoryCard story={summary({ contentType: "update" as StorySummary["contentType"] })} />,
    );

    expect(html).toContain("bg-brand-soft");
    expect(html).toContain('href="/stories/a-child-learns"');
  });
});
