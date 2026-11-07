import { describe, expect, it } from "vitest";

import { buildWhatsAppMessage, splitWhatsAppMessage } from "@/features/newsletter/whatsapp";

const body = {
  blocks: [
    { type: "heading", level: 2, text: "March update" },
    { type: "paragraph", text: "Three new classrooms opened." },
    {
      type: "list",
      ordered: false,
      items: ["More desks", "New teachers"],
    },
    { type: "quote", text: "We Leave No Child Behind." },
    { type: "callout", text: "Both schools travelled." },
  ],
};

describe("buildWhatsAppMessage", () => {
  it("renders blocks with WhatsApp formatting", () => {
    const text = buildWhatsAppMessage({ name: "March", subject: "Big news", body });
    expect(text).toBe(
      "*Big news*\n\n*March update*\n\nThree new classrooms opened.\n\n• More desks\n• New teachers\n\n> We Leave No Child Behind.\n\n_Both schools travelled._",
    );
  });

  it("numbers ordered lists", () => {
    const text = buildWhatsAppMessage({
      name: "n",
      subject: "s",
      body: {
        blocks: [{ type: "list", ordered: true, items: ["one", "two"] }],
      },
    });
    expect(text).toContain("1. one\n2. two");
  });

  it("returns empty text for an empty body", () => {
    expect(buildWhatsAppMessage({ name: "n", subject: "s", body: {} })).toBe("");
    expect(buildWhatsAppMessage({ name: "n", subject: "s", body: { blocks: [] } })).toBe("");
  });

  it("drops blank blocks like image captions", () => {
    const text = buildWhatsAppMessage({
      name: "n",
      subject: "s",
      body: {
        blocks: [
          { type: "paragraph", text: "Hello" },
          { type: "image", mediaId: "m", altText: "a", caption: "" },
        ],
      },
    });
    expect(text).toBe("*s*\n\nHello");
  });
});

describe("splitWhatsAppMessage", () => {
  const short = buildWhatsAppMessage({ name: "n", subject: "s", body });

  it("returns one part under the limit", () => {
    expect(splitWhatsAppMessage(short)).toEqual([short]);
  });

  it("splits on paragraph boundaries above the limit", () => {
    const paragraph = "x".repeat(300);
    const long = Array.from({ length: 30 }, () => paragraph).join("\n\n");
    const parts = splitWhatsAppMessage(long, 1000);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(part.length).toBeLessThanOrEqual(1000);
    }
    expect(parts.join("\n\n")).toBe(long);
  });

  it("hard-splits a single over-long paragraph without losing text", () => {
    const text = "y".repeat(2500);
    const parts = splitWhatsAppMessage(text, 1000);
    expect(parts).toHaveLength(3);
    expect(parts.join("")).toBe(text);
  });
});
