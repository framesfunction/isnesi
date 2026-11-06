/**
 * Structured content block helpers shared by every CMS module.
 *
 * Blocks are the only rich-text vocabulary the public renderer understands
 * (`components/public/content-blocks.tsx`). Text areas submit either JSON or
 * blank-line separated plain text; both are normalised here before Zod checks
 * the result, so unknown shapes never reach the database.
 */

/** Raw blocks come from a JSON textarea or an HTML textarea with newline blocks. */
export function parseBlocksField(raw: string | File | null): unknown {
  if (raw === null || typeof raw !== "string") return [];
  const trimmed = raw.trim().replace(/\r\n/g, "\n");

  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return []; // Invalid JSON falls through; schema validation reports the friendlier error.
    }
  }

  // Blank-line separated plain text: every non-empty chunk becomes a paragraph.
  return trimmed
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({ type: "paragraph", text: chunk }));
}

/** Pull the renderable block list out of a translation body of `{ blocks }` or array shape. */
export function extractBlocks(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const blocks = (body as Record<string, unknown>).blocks;
    return Array.isArray(blocks) ? blocks : null;
  }
  return null;
}

/** Editor-side block vocabulary (shared with components/admin/block-editor.tsx). */
export type EditorBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "quote"; text: string }
  | { type: "callout"; text: string }
  | { type: "image"; mediaId: string; altText: string; caption: string };

function emptyBlock(type: EditorBlock["type"]): EditorBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "list":
      return { type: "list", items: [""], ordered: false };
    case "quote":
      return { type: "quote", text: "" };
    case "callout":
      return { type: "callout", text: "" };
    case "image":
      return { type: "image", mediaId: "", altText: "", caption: "" };
  }
}

/** Convert a stored body (`{ blocks: [...] }` or a bare array) into editor blocks. */
export function parseEditorBlocks(body: unknown): EditorBlock[] {
  const blocks = extractBlocks(body);
  if (!Array.isArray(blocks)) return [];
  return blocks.map((raw) => {
    if (typeof raw !== "object" || raw === null) return emptyBlock("paragraph");
    const b = raw as Record<string, unknown>;
    const type = String(b.type ?? "paragraph");
    switch (type) {
      case "heading":
        return { type: "heading", level: b.level === 3 ? 3 : 2, text: String(b.text ?? "") };
      case "paragraph":
        return { type: "paragraph", text: String(b.text ?? "") };
      case "list":
        return {
          type: "list",
          items: Array.isArray(b.items)
            ? b.items.map((item) => String(item ?? "")).filter((text) => text.length > 0)
            : [""],
          ordered: b.ordered === true,
        };
      case "quote":
        return { type: "quote", text: String(b.text ?? "") };
      case "callout":
        return { type: "callout", text: String(b.text ?? "") };
      case "image":
        return {
          type: "image",
          mediaId: String(b.mediaId ?? ""),
          altText: String(b.altText ?? ""),
          caption: String(b.caption ?? ""),
        };
      default:
        return emptyBlock("paragraph");
    }
  });
}