"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Global error boundary.
 *
 * Shows a safe, non-technical message and never renders stack traces or internal
 * identifiers to the visitor. The digest is displayed so a user can quote it when
 * reporting the problem.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side logging happens where the error is thrown; this keeps a client
    // breadcrumb without exposing details in the UI.
    console.error("[isnesi] unexpected error", { digest: error.digest });
  }, [error]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-xl px-5 py-24">
      <div className="rounded-3xl border-2 border-line bg-white p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-coral-strong">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-brand">
          We could not complete that request
        </h1>
        <p className="mt-4 text-ink-muted">
          The problem has been logged. Please try again — if it keeps happening, contact the ISNESI
          team and quote the reference below.
        </p>
        {error.digest ? (
          <p className="mt-4 rounded-xl bg-brand-soft p-3 font-mono text-xs text-brand">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-full border-2 border-brand px-6 text-sm font-bold text-brand"
          >
            Back to the homepage
          </Link>
        </div>
      </div>
    </main>
  );
}