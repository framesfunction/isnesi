import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.1em]",
  {
    variants: {
      variant: {
        default: "bg-brand-soft text-brand",
        success: "bg-leaf-soft text-leaf",
        warning: "bg-sun-soft text-ink",
        danger: "bg-coral/20 text-[#8f2119]",
        neutral: "bg-muted text-ink-muted",
        outline: "border border-line bg-white text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };