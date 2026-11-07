/**
 * Plain-text email rendering for newsletter campaigns.
 *
 * Shared by the `newsletter-send` Edge Function. Pure: no provider, no
 * network, no secrets. The provider hook lives in the Edge Function and fails
 * closed until `NEWSLETTER_PROVIDER` is configured.
 */

export type EmailMessageInput = {
  name: string;
  subject: string;
  body: unknown;
};

function extractBlocks(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const blocks = (body as Record<string, unknown>).blocks;
    return Array.isArray(blocks) ? blocks : [];
  }
  return [];
}

function renderBlock(block: unknown): string {
  if (typeof block !== "object" || block === null) return "";
  const b = block as Record<string, unknown>;
  const type = String(b.type ?? "paragraph");
  const text = String(b.text ?? "");
  switch (type) {
    case "heading":
      return text.toUpperCase();
    case "paragraph":
      return text;
    case "list": {
      const items = Array.isArray(b.items) ? b.items : [];
      const ordered = b.ordered === true;
      return items
        .map(
          (item, index) =>
            `${ordered ? `${index + 1}. ` : "• "}${String(item ?? "")}`,
        )
        .join("\n");
    }
    case "quote":
      return `> ${text}`;
    case "callout":
      return `*${text}*`;
    case "image":
      return String(b.caption ?? "");
    default:
      return "";
  }
}

/** Render a campaign to plain-text email body (subject line first). */
export function buildEmailMessage(input: EmailMessageInput): string {
  const blocks = extractBlocks(input.body);
  if (blocks.length === 0) return "";

  const sections = blocks.map(renderBlock).map((t) => t.trim()).filter((t) => t.length > 0);
  if (sections.length === 0) return "";

  return [input.subject, ...sections].join("\n\n");
}
