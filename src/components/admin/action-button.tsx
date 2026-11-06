"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/admin/action-result";
type ButtonProps = {
  action: (
    state: ActionResult<unknown> | undefined,
    formData: FormData,
  ) => Promise<ActionResult<unknown>>;
  /** `false` values are omitted so checkbox-style actions parse them as off. */ hidden?: Record<
    string,
    string | number | boolean
  >;
  label: string;
  variant?: "default" | "ghost" | "danger" | "outline";
  confirm?: string;
  disabled?: boolean;
};
const BUTTON_STYLES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-brand text-cream hover:opacity-90 disabled:opacity-60",
  ghost:
    "bg-white text-brand border border-line hover:border-brand disabled:opacity-60",
  outline:
    "bg-white text-ink border border-line hover:text-brand disabled:opacity-60",
  danger:
    "bg-white text-coral-strong border border-coral/40 hover:border-coral disabled:opacity-60",
};
/** * One action, one button. * * Content management workflows are a row of distinct verbs (move up, hide, * archive, publish), not multi-field forms, so each gets its own minimal * `<form>`: hidden inputs carry the row ids and the Server Action re-checks * permissions server-side before touching the database. */ export function ActionButton({
  action,
  hidden = {},
  label,
  variant = "ghost",
  confirm,
  disabled,
}: ButtonProps) {
  const [state, formAction, pending] = useActionState(
    action,
    undefined as ActionResult<unknown> | undefined,
  );
  return (
    <form action={formAction} className="contents">
      {" "}
      {state?.message ? (
        <p
          className="basis-full text-xs font-bold text-coral-strong"
          role="status"
          aria-live="polite"
        >
          {" "}
          {state.message}{" "}
        </p>
      ) : null}{" "}
      {Object.entries(hidden)
        .filter(([, value]) => value !== false)
        .map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={String(value)} />
        ))}{" "}
      <button
        type="submit"
        disabled={disabled || pending}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-opacity ${BUTTON_STYLES[variant]}`}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          if (confirm && !window.confirm(confirm)) {
            event.preventDefault();
          }
        }}
      >
        {" "}
        {pending ? (
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        ) : null}{" "}
        {label}{" "}
      </button>{" "}
    </form>
  );
}
