import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Honest empty state with onboarding guidance.
 *
 * Admin screens must never imply data exists when it does not, so an empty list
 * always says what is missing, why it matters, and what to do next. The frame
 * matches the public EmptyNote treatment (dashed, cream), so the "nothing here"
 * message feels the same in both applications.
 *
 * Empty states are onboarding opportunities: tell users what will appear here,
 * why it matters, and give them a clear first action.
 */
export function EmptyState({
  title,
  description,
  action,
  whatWillBeHere,
  whyItMatters,
  getStartedCta,
  icon: Icon,
  helpText,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** What will appear in this space once content exists. */
  whatWillBeHere?: string;
  /** Why this space matters to the user's work. */
  whyItMatters?: string;
  /** Label + href for the first action, rendered as a link button. */
  getStartedCta?: { label: string; href: string };
  /** Optional lucide icon for visual interest. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Contextual help link shown below the action. */
  helpText?: { label: string; href: string };
}) {
  return (
    <div className="rounded-[1.75rem] border-2 border-dashed border-line bg-cream p-8">
      <div className="flex flex-col items-center justify-start text-center sm:items-start sm:text-left">
        {Icon ? (
          <div className="mb-4 sm:mb-0 sm:mr-4 sm:mt-0 sm:self-start">
            <Icon className="size-6 shrink-0 text-brand" aria-hidden="true" />
          </div>
        ) : null}
        <div>
          <p className="font-display text-base font-extrabold text-brand">{title}</p>
          {description ? (
            <p className="mt-2 max-w-md text-sm text-ink-muted">{description}</p>
          ) : null}
          {whatWillBeHere ? (
            <p className="mt-3 text-sm text-ink-muted">
              <span className="font-black text-ink">What will be here: </span>
              {whatWillBeHere}
            </p>
          ) : null}
          {whyItMatters ? (
            <p className="mt-2 text-sm text-ink-muted">
              <span className="font-black text-ink">Why it matters: </span>
              {whyItMatters}
            </p>
          ) : null}
          {getStartedCta ? (
            <p className="mt-4 flex items-center gap-2">
              <Link
                href={getStartedCta.href}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-[0_4px_0_var(--brand-strong)] transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none"
              >
                {getStartedCta.label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </p>
          ) : null}
          {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
          {helpText ? (
            <p className="mt-4 text-xs text-ink-muted">
              <Link
                href={helpText.href}
                className="font-bold text-brand hover:underline"
              >
                {helpText.label}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
