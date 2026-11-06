import { describe, expect, it } from "vitest";

import {
  buildStoryJsonLd,
  estimateReadingMinutes,
  isStoryType,
  schemaTypeFor,
  storyTypeChip,
  storyTypeLabel,
  storyTypeOptions,
  storyTypePlural,
} from "@/features/editorial/helpers";

describe("storyTypeLabel", () => {
  it("labels every known content type", () => {
    expect(storyTypeLabel("story")).toBe("Story");
    expect(storyTypeLabel("news")).toBe("News");
    expect(storyTypeLabel("announcement")).toBe("Announcement");
    expect(storyTypeLabel("policy")).toBe("Policy");
  });

  it("falls back to a neutral label for an unknown type", () => {
    expect(storyTypeLabel("video")).toBe("Update");
  });
});

describe("isStoryType", () => {
  it("narrows the known types and rejects anything else", () => {
    expect(isStoryType("story")).toBe(true);
    expect(isStoryType("policy")).toBe(true);
    expect(isStoryType("video")).toBe(false);
  });
});

describe("storyTypeChip", () => {
  it("gives every known type a tone and an unknown type a neutral one", () => {
    expect(storyTypeChip("news")).toContain("brand");
    expect(storyTypeChip("story")).toContain("leaf");
    expect(storyTypeChip("video")).toContain("ring");
  });
});

describe("storyTypeOptions", () => {
  it("keeps a stable filter order", () => {
    expect(storyTypeOptions().map((option) => option.value)).toEqual([
      "story",
      "news",
      "announcement",
      "policy",
    ]);
  });
});

describe("storyTypePlural", () => {
  it("pluralises each type for headings and titles", () => {
    expect(storyTypePlural("story")).toBe("Stories");
    expect(storyTypePlural("news")).toBe("News");
    expect(storyTypePlural("announcement")).toBe("Announcements");
    expect(storyTypePlural("policy")).toBe("Policies");
  });

  it("falls back to a neutral plural", () => {
    expect(storyTypePlural("video")).toBe("Stories");
  });
});

describe("estimateReadingMinutes", () => {
  it("returns at least one minute for an empty body", () => {
    expect(estimateReadingMinutes({} as never)).toBe(1);
  });

  it("rounds up around the 200 words-per-minute mark", () => {
    const body = { blocks: [{ type: "paragraph", text: Array(200).fill("word").join(" ") }] };
    expect(estimateReadingMinutes(body as never)).toBe(1);

    const longer = { blocks: [{ type: "paragraph", text: Array(420).fill("word").join(" ") }] };
    expect(estimateReadingMinutes(longer as never)).toBe(2);
  });

  it("counts list items as well as paragraphs", () => {
    const body = {
      blocks: [
        { type: "paragraph", text: "Fifty words here" },
        { type: "list", items: [Array(150).fill("item").join(" ")], ordered: false },
      ],
    };
    expect(estimateReadingMinutes(body as never)).toBe(1);
  });

  it("ignores malformed blocks", () => {
    expect(estimateReadingMinutes([null, 42, "text"] as never)).toBe(1);
  });
});

describe("schemaTypeFor", () => {
  it("treats news and announcements as NewsArticle", () => {
    expect(schemaTypeFor("news")).toBe("NewsArticle");
    expect(schemaTypeFor("announcement")).toBe("NewsArticle");
    expect(schemaTypeFor("story")).toBe("Article");
    expect(schemaTypeFor("policy")).toBe("Article");
  });
});

describe("buildStoryJsonLd", () => {
  const base = {
    baseUrl: "https://isnesi.example/",
    path: "/stories/first-day",
    headline: "A first day to remember",
    description: "How a community welcomed a new learner.",
    datePublished: "2026-02-14T10:00:00.000Z",
    dateModified: "2026-02-15T09:00:00.000Z",
    contentType: "news" as const,
    siteName: "ISNESI",
  };

  it("builds a NewsArticle plus a three-step breadcrumb", () => {
    const [article, breadcrumb] = buildStoryJsonLd(base);

    expect(article["@type"]).toBe("NewsArticle");
    expect(article.url).toBe("https://isnesi.example/stories/first-day");
    expect(article.datePublished).toBe(base.datePublished);

    const items = breadcrumb.itemListElement as { position: number; item: string }[];
    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(items[1].item).toBe("https://isnesi.example/stories");
    expect(items[2].item).toBe("https://isnesi.example/stories/first-day");
  });

  it("omits empty optional fields rather than emitting null", () => {
    const [article] = buildStoryJsonLd({
      ...base,
      description: null,
      datePublished: null,
      dateModified: null,
    });

    expect("description" in article).toBe(false);
    expect("datePublished" in article).toBe(false);
    expect("dateModified" in article).toBe(false);
  });

  it("serialises to valid, markup-free JSON", () => {
    const serialised = JSON.stringify(buildStoryJsonLd(base));
    expect(serialised).not.toContain("</script>");
    expect(JSON.parse(serialised)).toHaveLength(2);
  });
});
