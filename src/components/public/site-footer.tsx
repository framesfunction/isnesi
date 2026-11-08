import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { publicNavigation, siteConfig } from "@/lib/site";

/**
 * Public site footer.
 *
 * Every navigation entry has a real destination on this site. Where the
 * organisation has not yet published a document (privacy, registration
 * numbers), the copy says so plainly instead of linking to nothing.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t-2 border-line bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="md:col-span-2">
          <BrandMark variant="footer" />
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            {siteConfig.description}
          </p>
          <p className="mt-4 text-sm font-semibold text-brand">{siteConfig.tagline}</p>
        </div>

        <nav aria-labelledby="footer-explore" className="text-sm">
          <h2 id="footer-explore" className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
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
            <li>
              <Link
                href="/kids-corner"
                className="rounded text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Kids&apos; Corner
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-involved" className="text-sm">
          <h2 id="footer-involved" className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
            Get involved
          </h2>
          <ul className="grid gap-2">
            <li>
              <Link
                href="/get-involved"
                className="rounded text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Volunteer or partner
              </Link>
            </li>
            <li>
              <Link
                href="/donate"
                className="rounded text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Donate
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="rounded text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Contact the team
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="block rounded min-h-[44px] px-3 py-2 text-ink-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Staff access
              </Link>
            </li>
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">
            Safeguarding
          </h2>
          <p className="text-ink">
            If a child is at immediate risk, contact your local emergency or child-protection
            services <strong>first</strong>.
          </p>
          <p className="mt-3 text-ink-muted">
            Do not use website forms to report a child at risk. Our referral route goes through
            designated safeguarding officers —{" "}
            <Link href="/contact" className="rounded text-brand hover:underline">
              contact the team
            </Link>{" "}
            and a staff member will point you to the right channel.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy" className="hover:text-brand hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-brand hover:underline">
              Terms
            </Link>
            <Link href="/accessibility" className="hover:text-brand hover:underline">
              Accessibility
            </Link>
            <Link href="/safeguarding" className="hover:text-brand hover:underline">
              Safeguarding
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
