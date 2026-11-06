"use client";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useActionState } from "react";
import type { ActionResult } from "@/lib/admin/action-result";
/** * Shared wrapper for admin forms driven by Server Actions. * * Every module's forms share one state (`ActionResult`), one message area and * one pending submit button, so feedback is identical everywhere. Field errors * are listed in the message area; the server always re-validates, so a crafted * request gains exactly nothing from any client-side behaviour here. */ export function ActionForm({
  action,
  children,
  submitLabel,
  className,
  successMessage,
}: {
  action: (
    state: ActionResult<unknown> | undefined,
    formData: FormData,
  ) => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  successMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    undefined as ActionResult<unknown> | undefined,
  );
  const success = state?.status === "success";
  return (
    <form action={formAction} className={className}>
      {" "}
      {state?.message ? (
        <p
          role="status"
          aria-live="polite"
          className={
            success
              ? "mb-4 flex items-start gap-2 rounded-2xl border border-leaf/40 bg-leaf-soft/60 p-3 text-sm font-bold text-leaf-strong"
              : "mb-4 flex items-start gap-2 rounded-2xl border border-coral/40 bg-white p-3 text-sm font-bold text-coral-strong"
          }
        >
          {" "}
          {success ? (
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
          ) : (
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
          )}{" "}
          <span>
            {" "}
            {success ? (successMessage ?? state.message) : state.message}{" "}
            {state.fieldErrors && Object.keys(state.fieldErrors).length > 0 ? (
              <span className="mt-1 block list-inside list-disc font-normal text-ink-muted">
                {" "}
                {Object.entries(state.fieldErrors).map(([field, message]) => (
                  <span key={field} className="block">
                    {" "}
                    {field}: {message}{" "}
                  </span>
                ))}{" "}
              </span>
            ) : null}{" "}
          </span>{" "}
        </p>
      ) : null}{" "}
      {children}{" "}
      <div className="mt-4 flex items-center gap-3">
        {" "}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {" "}
          {pending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}{" "}
          {submitLabel}{" "}
        </button>{" "}
      </div>{" "}
    </form>
  );
}
