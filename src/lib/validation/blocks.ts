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