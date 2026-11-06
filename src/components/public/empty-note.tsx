import type { ReactNode } from "react";

/**
 * Honest empty state, used instead of hiding a whole section.
 *
 * One treatment for every public page: a dashed frame, one heading, one line of
 * explanation, and optionally a link back to something useful.
 */
export function EmptyNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.75rem] border-2 border-dashed border-line bg-cream p-8">
      <h3 className="font-display text-lg font-black text-brand">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{children}</p>
    </div>
  );
}
