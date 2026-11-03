import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Native select.
 *
 * Deliberately a real `<select>`: keyboard behaviour, screen-reader support and
 * form participation come from the browser, and the admin lists must keep
 * working without JavaScript. Styled to match `Input`.
 */
function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="select"
      className={cn(
        "flex min-h-11 w-full rounded-xl border-2 border-input bg-white px-4 py-2.5 text-sm text-ink transition-colors",
        "focus-visible:border-brand",
        "aria-[invalid=true]:border-destructive",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
