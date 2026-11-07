import { describe, expect, it } from "vitest";

import { buildEmailMessage } from "@/features/newsletter/email";

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

describe("buildEmailMessage", () => {
  it("renders subject then blocks as plain text", () => {
    const message = buildEmailMessage({ name: "March", subject: "Big news", body });
    expect(message).toBe(
      "Big news\n\nMARCH UPDATE\n\nThree new classrooms opened.\n\n• More desks\n• New teachers\n\n> We Leave No Child Behind.\n\n*Both schools travelled.*",
    );
  });

  it("numbers ordered lists", () => {
    const message = buildEmailMessage({
      name: "n",
      subject: "s",
      body: { blocks: [{ type: "list", ordered: true, items: ["one", "two"] }] },
    });
    expect(message).toContain("1. one\n2. two");
  });

  it("returns empty string for an empty body", () => {
    expect(buildEmailMessage({ name: "n", subject: "s", body: {} })).toBe("");
    expect(buildEmailMessage({ name: "n", subject: "s", body: { blocks: [] } })).toBe("");
  });

  it("drops blank blocks", () => {
    const message = buildEmailMessage({
      name: "n",
      subject: "s",
      body: {
        blocks: [
          { type: "paragraph", text: "Hello" },
          { type: "image", mediaId: "m", altText: "a", caption: "" },
        ],
      },
    });
    expect(message).toBe("s\n\nHello");
  });

  it("uses the recipient name as a personalisation hook", () => {
    const message = buildEmailMessage({ name: "Ada", subject: "Hi", body: { blocks: [{ type: "paragraph", text: "Welcome" }] } });
    expect(message).toBe("Hi\n\nWelcome");
  });
});
