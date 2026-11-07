import { parseEditorBlocks } from "@/lib/validation/blocks";

/**
 * WhatsApp campaign rendering.
 *
 * Until a WhatsApp Business API provider is connected, distribution is manual:
 * staff paste the rendered text into Broadcast lists, Status or groups. These
 * builders are pure so tests can pin the vocabulary exactly.
 */

export type WhatsAppMessageInput = {
  name: string;
  subject: string;
  body: unknown;
};

const HEADINGS: Record<"h2" | "h3", string> = { h2: "*", h3: "*" };
const LIMIT = 4000;

/** Render one editor block to WhatsApp plain text (WhatsApp markdown flavour). */
function renderBlock(block: ReturnType<typeof parseEditorBlocks>[number]): string {
  switch (block.type) {
    case "heading":
      return `${HEADINGS[block.level === 3 ? "h3" : "h2"]}${block.text}${HEADINGS[block.level === 3 ? "h3" : "h2"]}`;
    case "paragraph":
      return block.text;
    case "list":
      return block.items
        .map((item, index) => (block.ordered ? `${index + 1}. ${item}` : `• ${item}`))
        .join("\n");
    case "quote":
      return block.text
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "callout":
      return `_${block.text}_`;
    case "image":
      return block.caption || "";
    default:
      return "";
  }
}

/**
 * Render a campaign to WhatsApp text. Returns empty string when the body has
 * no renderable blocks. Blank lines separate blocks, WhatsApp style.
 */
export function buildWhatsAppMessage(input: WhatsAppMessageInput): string {
  const blocks = parseEditorBlocks(input.body);
  if (blocks.length === 0) return "";

  const sections = blocks
    .map(renderBlock)
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  const subject = `${HEADINGS.h2}${input.subject}${HEADINGS.h2}`;
  return [subject, ...sections].join("\n\n");
}

/**
 * Split a message into WhatsApp-sized parts on paragraph boundaries.
 * WhatsApp's practical message ceiling is ~4000 characters; a Broadcast list
 * send should paste each part in order.
 */
export function splitWhatsAppMessage(text: string, limit = LIMIT): string[] {
  if (text.length <= limit) return [text];

  const paragraphs = text.split("\n\n");
  const parts: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    // A single paragraph longer than the limit is hard-split; nothing else is lost.
    const chunks =
      paragraph.length > limit
        ? chunkPlain(paragraph, limit)
        : [paragraph];
    for (const chunk of chunks) {
      const candidate = current ? `${current}\n\n${chunk}` : chunk;
      if (candidate.length > limit && current) {
        parts.push(current);
        current = chunk;
      } else {
        current = candidate;
      }
    }
  }
  if (current) parts.push(current);
  return parts;
}

function chunkPlain(text: string, limit: number): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += limit) {
    chunks.push(text.slice(start, start + limit));
  }
  return chunks;
}
