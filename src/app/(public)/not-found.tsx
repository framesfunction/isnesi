import Link from "next/link";

import { publicNavigation, siteConfig } from "@/lib/site";

/**
 * 404 for the public website.
 *
 * Rendered inside the (public) layout, so a lost visitor still gets the full
 * site chrome — header, footer and a way back — instead of a bare page. FAQs
 * about unpublished routes are answered in the copy, not with invented links.
 */
export default function PublicNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16 sm:py-24">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf-strong">
        Page not found
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-brand sm:text-5xl">
        We could not find that page
      </h1>
      <p className="mt-4 text-ink-muted">
        The link may be out of date, or the page may not be published yet. Here are the main
        sections of the {siteConfig.name} website.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {publicNavigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-[1.25rem] border border-line bg-white p-4 shadow-[0_12px_40px_rgba(24,36,67,0.06)] transition-transform hover:-translate-y-1 focus-within:-translate-y-1"
            >
              <span className="block font-display font-extrabold text-brand">{item.label}</span>
              <span className="mt-1 block text-xs text-ink-muted">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-black text-white shadow-[0_6px_0_var(--brand-strong)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Back to the homepage
        </Link>
        <Link
          href="/contact"
          className="inline-flex min-h-12 items-center rounded-full border-2 border-brand bg-white px-6 text-sm font-black text-brand transition-transform hover:-translate-y-0.5"
        >
          Report a broken link
        </Link>
      </div>
    </div>
  );
}
