import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Text input. Focus is shown by the global `:focus-visible` outline, which is
 * kept rather than suppressed so the control stays WCAG 2.2 AA compliant.
 */
function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex min-h-11 w-full rounded-xl border-2 border-input bg-white px-4 py-2.5 text-sm text-ink transition-colors",
        "placeholder:text-ink-muted/70",
        "focus-visible:border-brand",
        "aria-[invalid=true]:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand",
        className,
      )}
      {...props}
    />
  );
}

export { Input };