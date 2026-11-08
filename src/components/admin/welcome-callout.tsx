"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ONBOARDING_SEEN_KEY = "isnesi-admin-onboarding-seen";

/**
 * First-run welcome callout for the admin dashboard.
 *
 * Shown once per browser session (tracked in localStorage) and dismissable.
 * Guides new staff to the dashboard's aha moment: live counts + quick links
 * to act. Never blocks access to the product; experienced users can dismiss
 * it and never see it again.
 */
export function WelcomeCallout() {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_SEEN_KEY) === "true";
    } catch {
      return true;
    }
  });

  const dismiss = () => {
    setSeen(true);
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } catch {
      // localStorage unavailable; dismissal is ephemeral.
    }
  };

  if (seen) return null;

  return (
    <Card className="mb-6 border border-line bg-brand-soft/40">
      <CardHeader className="flex flex-row items-start gap-3 pb-3">
        <div className="flex shrink-0 items-center justify-center rounded-full bg-brand p-2">
          <CheckCircle2 className="size-5 shrink-0 text-white" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-base font-black text-brand leading-none">
            Welcome to the ISNESI admin studio
          </CardTitle>
        </div>
        <button
          onClick={dismiss}
          className="ml-auto shrink-0 rounded-full p-1.5 text-brand-strong hover:bg-brand-soft/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label="Dismiss welcome"
        >
          <span className="sr-only">Dismiss welcome</span>
          <span aria-hidden="true">✕</span>
        </button>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="mb-3 text-sm text-ink-muted">
          This is your operational workboard. Start here:
        </p>
        <ol className="space-y-2 text-sm text-ink-muted mb-4">
          <li className="flex items-start gap-2">
            <span className="shrink-0 text-xs font-black text-brand leading-none">1</span>
            Check the <span className="font-black text-ink">live counts</span> at the top — programmes, partners, stories, and more.
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 text-xs font-black text-brand leading-none">2</span>
            Open <span className="font-black text-ink">one task at a time</span> using the modules on the left — saving one item before moving on prevents missed changes.
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 text-xs font-black text-brand leading-none">3</span>
            Search <span className="font-black text-ink">before creating</span> — check whether a page, programme, story, or partner already exists.
          </li>
        </ol>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/help"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-4 py-2 text-xs font-bold text-brand transition-colors hover:bg-brand-soft hover:text-brand-strong"
          >
            Full guide
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="text-xs text-ink-muted">
            Already know the system?{" "}
            <button
              onClick={dismiss}
              className="font-bold text-brand underline decoration-brand/30 hover:decoration-brand/70"
            >
              Dismiss
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
