"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/features/auth/actions";
import { initialSignInState, type SignInState } from "@/features/auth/state";

type LoginFormProps = {
  /** Same-origin path to return to after signing in. */
  next?: string;
};

/**
 * Staff sign-in form.
 *
 * Uses the native form action with `useActionState`, so it still submits if
 * JavaScript fails to load. Validation and the credential check both happen on
 * the server; the browser never decides the outcome.
 */
export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signInAction,
    initialSignInState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="you@isnesi.org"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>

      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-xl border-2 border-destructive/30 bg-white p-3 text-sm font-semibold text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs text-ink-muted">
        Accounts are created by invitation. If you cannot sign in, contact an ISNESI administrator —
        access is never granted from this page.
      </p>
    </form>
  );
}