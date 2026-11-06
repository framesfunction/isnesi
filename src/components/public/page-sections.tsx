import { ContentBlocks } from "@/components/public/content-blocks";
import type { PublicPageSection } from "@/features/pages/queries";
import type { Json } from "@/types/database";

/**
 * Renderer for published page sections.
 *
 * Sections carry a `section_type` and a structured `config`. Two documented
 * contracts are supported today:
 *   { "blocks": [ ...ContentBlocks vocabulary... ] }
 *   { "heading": "...", "text": "..." }
 *
 * Anything else renders nothing, so unpublished or unknown section types can
 * never inject markup into the public site.
 */
export function PageSections({ sections }: { sections: PublicPageSection[] }) {
  const renderable = sections.filter((section) => section.config !== null);

  if (renderable.length === 0) return null;

  return (
    <div className="grid gap-8">
      {renderable.map((section) => {
        const config =
          section.config && typeof section.config === "object" && !Array.isArray(section.config)
            ? (section.config as Record<string, unknown>)
            : {};

        const heading = typeof config.heading === "string" ? config.heading : null;
        const text = typeof config.text === "string" ? config.text : null;
        const hasBlocks = "blocks" in config;

        if (!hasBlocks && !heading && !text) return null;

        return (
          <section
            key={section.id}
            aria-label={heading ?? section.key}
            className="rounded-[1.75rem] border border-line bg-white p-6 shadow-[0_12px_40px_rgba(24,36,67,0.06)] sm:p-8"
          >
            {heading ? (
              <h2 className="font-display text-2xl font-black tracking-tight text-brand">
                {heading}
              </h2>
            ) : null}
            {text ? <p className="max-w-2xl text-ink-muted">{text}</p> : null}
            {hasBlocks ? <ContentBlocks body={config.blocks as Json} /> : null}
          </section>
        );
      })}
    </div>
  );
}