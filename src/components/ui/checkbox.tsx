import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Checkbox.
 *
 * Uses the native control with `accent-color` so that checked/indeterminate
 * states, keyboard behaviour and screen-reader semantics come from the browser
 * and the OS theme. No custom painting means no invisible focus or state bugs.
 *
 * Pair with <Label htmlFor="..."> — never rely on a click target alone.
 */
type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-5 shrink-0 cursor-pointer rounded accent-brand",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };