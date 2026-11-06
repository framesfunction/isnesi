import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Section-level link used beside a section heading.
 *
 * One shared component keeps the action style identical on every public page;
 * it is intentionally the same treatment the Impact page uses.
 */
export function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-5 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft"
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
