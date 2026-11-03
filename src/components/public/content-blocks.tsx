import type { Json } from "@/types/database";

/**
 * Safe renderer for structured CMS body content.
 *
 * Bodies are stored as `jsonb` and are never executed as HTML, so this renderer
 * only understands a small, explicit block vocabulary. Unknown blocks are
 * skipped rather than rendered raw, which keeps stored data from becoming a
 * script-injection vector.
 *
 * Supported shapes (either `{ "blocks": [...] }` or a bare array):
 *   { "type": "heading",   "text": "...", "level": 2 | 3 }
 *   { "type": "paragraph", "text": "..." }
 *   { "type": "list",      "items": ["..."], "ordered": false }
 *   { "type": "quote",     "text": "..." }
 *   { "type": "callout",   "text": "..." }
 */

type Block =
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "quote"; text: string }
  | { type: "callout"; text: string };

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function parseBlocks(body: Json): Block[] {
  const root = Array.isArray(body) ? body : (asObject(body)?.blocks ?? null);
  if (!Array.isArray(root)) return [];

  const blocks: Block[] = [];

  for (const raw of root) {
    const candidate = asObject(raw);
    if (!candidate) continue;

    const type = asString(candidate.type);
    const text = asString(candidate.text);

    switch (type) {
      case "heading":
        if (text) blocks.push({ type: "heading", text, level: candidate.level === 3 ? 3 : 2 });
        break;
      case "paragraph":
        if (text) blocks.push({ type: "paragraph", text });
        break;
      case "quote":
        if (text) blocks.push({ type: "quote", text });
        break;
      case "callout":
        if (text) blocks.push({ type: "callout", text });
        break;
      case "list": {
        const items = Array.isArray(candidate.items)
          ? candidate.items.map((item) => asString(item)).filter((item): item is string => !!item)
          : [];
        if (items.length > 0) {
          blocks.push({ type: "list", items, ordered: candidate.ordered === true });
        }
        break;
      }
      default:
        // Unknown block types are intentionally ignored.
        break;
    }
  }

  return blocks;
}

export function ContentBlocks({ body }: { body: Json }) {
  const blocks = parseBlocks(body);

  if (blocks.length === 0) return null;

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        switch (block.type) {
          case "heading":
            return block.level === 3 ? (
              <h3 key={key}>{block.text}</h3>
            ) : (
              <h2 key={key}>{block.text}</h2>
            );
          case "paragraph":
            return <p key={key}>{block.text}</p>;
          case "quote":
            return <blockquote key={key}>{block.text}</blockquote>;
          case "callout":
            return (
              <p key={key} className="rounded-2xl bg-brand-soft p-4 font-semibold text-brand">
                {block.text}
              </p>
            );
          case "list":
            return block.ordered ? (
              <ol key={key}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul key={key}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}