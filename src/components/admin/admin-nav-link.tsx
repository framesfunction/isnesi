"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavLinkProps = {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** Exact matching for the dashboard, prefix matching for modules. */
  exact?: boolean;
};

/**
 * Sidebar link with an `aria-current` state derived from the current path.
 * Keeping this client boundary small means the rest of the admin chrome can stay
 * on the server.
 */
export function AdminNavLink({ href, label, description, icon, exact }: AdminNavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun",
        active
          ? "bg-white/15 text-white shadow-[inset_3px_0_0_#ffc83d]"
          : "text-white/80 hover:bg-white/10 hover:text-white",
      ].join(" ")}
      title={description}
    >
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        <span className="mt-0.5 hidden truncate text-xs font-normal text-white/50 xl:block">
          {description}
        </span>
      </span>
    </Link>
  );
}