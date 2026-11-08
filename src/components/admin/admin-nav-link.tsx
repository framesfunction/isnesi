"use client";

import { useEffect, useState } from "react";
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
 *
 * The active state is deferred until after hydration: `usePathname()` returns
 * `/` during SSR but the real route on the client, so computing it synchronously
 * would produce a className / aria-current mismatch between the server HTML and
 * the hydrated client.
 */
export function AdminNavLink({
  href,
  label,
  description,
  icon,
  exact,
}: AdminNavLinkProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const active =
    mounted &&
    (exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex items-start gap-3 rounded-xl min-h-[44px] px-3 py-3 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun",
        active
          ? "bg-white/15 text-white shadow-[inset_3px_0_0_var(--sun)]"
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
