"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeNewsletterAction } from "@/features/newsletter/actions";
import { initialNewsletterState, type NewsletterFormState } from "@/features/newsletter/state";

/**
 * Newsletter sign-up, built on the same primitives as every other form.
 *
 * The subscription itself is consent-first: the checkbox is required and the
 * server records a consent row before anything can be marketed to, so the form
 * never collects an address without one.
 */
export function NewsletterForm() {
  const [state, formAction, pending] = useActionState<NewsletterFormState, FormData>(
    subscribeNewsletterAction,
    initialNewsletterState,
  );
  const id = useId();

  const fieldErrors = state.fieldErrors ?? {};
  const hasError = Boolean(fieldErrors.email);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-email`}>Email address</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-email-error` : undefined}
        />
        {hasError ? (
          <p id={`${id}-email-error`} className="text-xs font-semibold text-destructive">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id={`${id}-consent`}
          name="consent"
          required
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.consent)}
          aria-describedby={fieldErrors.consent ? `${id}-consent-error` : undefined}
        />
        <Label
          htmlFor={`${id}-consent`}
          className="items-start leading-snug"
        >
          <span>I agree to receive ISNESI news and updates by email.</span>
        </Label>
      </div>
      {fieldErrors.consent ? (
        <p id={`${id}-consent-error`} className="text-xs font-semibold text-destructive">
          {fieldErrors.consent}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-xl border-2 border-destructive/30 bg-white p-3 text-sm font-semibold text-destructive"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border-2 border-leaf/40 bg-white p-3 text-sm font-bold text-leaf-strong"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-leaf-strong" />
          <span>{state.message}</span>
        </p>
      ) : null}

      <div>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}
