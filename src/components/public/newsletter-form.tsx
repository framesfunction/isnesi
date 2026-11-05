"use client";

import { useActionState } from "react";

import { subscribeNewsletterAction } from "@/features/newsletter/actions";
import { initialNewsletterState } from "@/features/newsletter/state";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeNewsletterAction,
    initialNewsletterState,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <label className="text-xs font-bold uppercase tracking-[0.12em]" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        className="min-h-11 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
      />
      <label className="flex gap-2 text-xs text-muted">
        <input name="consent" type="checkbox" required className="mt-0.5" />
        <span>I agree to receive ISNESI news and updates by email.</span>
      </label>
      {state.status === "error" && state.message ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm font-semibold text-green-700" role="status">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );
}
