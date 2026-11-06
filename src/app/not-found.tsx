import Link from "next/link";

import { publicNavigation, siteConfig } from "@/lib/site";

/** Global 404 page (rendered inside the root layout). */
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-col px-5 py-24">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf-strong">Page not found</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-brand sm:text-5xl">
        We could not find that page
      </h1>
      <p className="mt-4 text-ink-muted">
        The link may be out of date, or the page may not be published. Here are the main sections of
        the {siteConfig.name} website.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {publicNavigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border-2 border-line bg-white p-4 transition-colors hover:border-brand/50"
            >
              <span className="block font-display font-extrabold text-brand">{item.label}</span>
              <span className="mt-1 block text-xs text-ink-muted">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white"
        >
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}