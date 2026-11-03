import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Button — shadcn/ui variant API implemented with a native <button>.
 *
 * The Base UI primitive is deliberately not used: every control in ISNESI is a
 * real button or a real link, so the primitive would add a dependency without
 * adding behaviour. Keyboard, focus and disabled semantics come from the browser.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 text-sm font-bold whitespace-nowrap transition-all select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-brand bg-brand text-white shadow-[0_4px_0_#10296e] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#10296e]",
        secondary: "border-brand-soft bg-brand-soft text-brand hover:bg-white hover:border-brand",
        outline: "border-brand bg-white text-brand hover:bg-brand-soft",
        ghost: "border-transparent text-brand hover:bg-brand-soft",
        highlight:
          "border-sun bg-sun text-ink shadow-[0_4px_0_#c38b00] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#c38b00]",
        destructive:
          "border-destructive/40 bg-white text-destructive hover:bg-destructive/10",
        link: "border-transparent text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-3.5 text-xs",
        lg: "min-h-12 px-6 text-base",
        icon: "size-11 rounded-full px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };