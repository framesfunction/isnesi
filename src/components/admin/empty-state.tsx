import type { ReactNode } from "react";

/**
 * Honest empty state.
 *
 * Admin screens must never imply data exists when it does not, so an empty list
 * always says what is missing and what to do next.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-cream p-8 text-center">
      <p className="font-display text-base font-extrabold text-brand">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
