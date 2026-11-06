import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Plain-language guidance panel for admin screens.
 *
 * Staff are not all technical. Every screen that can change the public website
 * or sensitive records explains, in one place, what it does, why it matters and
 * what happens when you save. This is the single treatment for that guidance so
 * it feels the same everywhere. It never writes data and never replaces an
 * error message.
 */
export function HelpCallout({
  title,
  tone = "info",
  children,
}: {
  title?: string;
  /** `caution` is for irreversible or public-facing consequences. */
  tone?: "info" | "caution";
  children: ReactNode;
}) {
  const isCaution = tone === "caution";
  return (
    <div
      className={[
        "rounded-2xl border p-4 text-sm",
        isCaution ? "border-coral/40 bg-coral/5" : "border-brand/20 bg-brand-soft/60",
      ].join(" ")}
    >
      <p className="flex items-center gap-2 font-bold text-brand">
        {isCaution ? (
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0 text-coral-strong" />
        ) : (
          <Info aria-hidden="true" className="size-4 shrink-0" />
        )}
        {title ?? (isCaution ? "Before you continue" : "How this works")}
      </p>
      <div className="mt-2 space-y-2 text-ink-muted">{children}</div>
    </div>
  );
}
