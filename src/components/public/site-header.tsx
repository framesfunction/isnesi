"use client";

import { Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { primaryCallsToAction, publicNavigation } from "@/lib/site";

/**
 * Public site header.
 *
 * - Sticky, keyboard accessible, with a visible focus ring on every control.
 * - The navigation comes from `lib/site.ts` today and will be driven by the
 *   `navigation_menus` CMS table in the public-integration phase.
 * - "Staff sign in" always points at /login; middleware sends already-signed-in
 *   staff straight to /admin.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const closeMenu = () => setOpen(false);

  // Close the mobile menu when the route changes. Resetting state during render
  // (guarded by the previous path) is React's recommended alternative to
  // calling setState inside an effect.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-line/80 bg-cream/95 backdrop-blur supports-backdrop-filter:bg-cream/80">
      <div className="mx-auto flex h-19 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <BrandMark variant="header" />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {publicNavigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "rounded-full px-3 py-2.5 min-h-[44px] text-sm font-semibold transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  active ? "bg-brand-soft text-brand" : "text-ink hover:bg-brand-soft hover:text-brand",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={primaryCallsToAction.donate.href}
            className="hidden items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_#10296e] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:inline-flex"
          >
            <Heart aria-hidden="true" className="size-4" />
            {primaryCallsToAction.donate.label}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border-2 border-line bg-white text-brand transition-colors hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
          >
            {open ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-navigation" className="border-t-2 border-line bg-cream px-5 pb-6 pt-3 lg:hidden">
          <nav aria-label="Mobile" className="grid gap-1">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-3 text-base font-semibold text-ink transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="block">{item.label}</span>
                <span className="block text-xs font-normal text-ink-muted">{item.description}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-2">
            <Link
              href={primaryCallsToAction.donate.href}
              onClick={closeMenu}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white"
            >
              <Heart aria-hidden="true" className="size-4" />
              {primaryCallsToAction.donate.label}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}