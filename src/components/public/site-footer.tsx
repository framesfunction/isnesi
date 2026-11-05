import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { publicNavigation, siteConfig } from "@/lib/site";

/**
 * Public site footer.
 *
 * The contact block is intentionally static for now; it will read the public
 * `organisation` site setting once the settings module is implemented.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t-2 border-line bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="md:col-span-2">
          <BrandMark variant="footer" />
          <p className="mt-4 max-w-sm text-sm text-muted">
            {siteConfig.description}
          </p>
          <p className="mt-4 text-sm font-semibold text-brand">{siteConfig.tagline}</p>
        </div>

        <nav aria-labelledby="footer-explore" className="text-sm">
          <h2 id="footer-explore" className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Explore
          </h2>
          <ul className="grid gap-2">
            {publicNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Get in touch</h2>
          <ul className="grid gap-2 text-ink">
            <li>
              <Link
                href="/contact"
                className="rounded transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Contact the team
              </Link>
            </li>
            <li>
              <Link
                href="/get-involved"
                className="rounded transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Volunteer or partner
              </Link>
            </li>
            <li>
              <Link
                href="/kids-corner"
                className="rounded transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Kids&apos; Corner
              </Link>
            </li>
          </ul>
        </div>

        <nav aria-labelledby="footer-involved" className="text-sm">
          <h2 id="footer-involved" className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Get involved
          </h2>
          <ul className="grid gap-2 text-ink">
            <li><Link href="/get-involved" className="hover:text-brand">Volunteer</Link></li>
            <li><Link href="/partners" className="hover:text-brand">Partner with us</Link></li>
            <li><Link href="/donate" className="hover:text-brand">Donate</Link></li>
            <li><Link href="/login" className="text-muted hover:text-brand">Staff access</Link></li>
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">Policies</h2>
          <p className="text-muted">
            Contact routes, privacy and safeguarding policies apply across the ISNESI website.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <p>Registered non-profit organisation. Privacy and safeguarding policies apply.</p>
        </div>
      </div>
    </footer>
  );
}