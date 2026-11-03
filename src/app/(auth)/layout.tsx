import type { ReactNode } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { siteConfig } from "@/lib/site";

/**
 * Authentication layout: a standalone, distraction-free sign-in surface.
 * No public header or footer, and nothing here is cached by the service worker.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-brand p-10 text-white lg:flex">
        <BrandMark variant="footer" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
            ISNESI administration
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
            Manage the website, programmes and public trust.
          </h1>
          <p className="mt-4 max-w-md text-white/75">
            Staff access is role-based and audited. Safeguarding casework is separate, restricted and
            available only to authorised officers through server-side functions.
          </p>
        </div>
        <p className="text-sm text-white/60">{siteConfig.tagline}</p>
      </section>

      <section className="flex items-center justify-center bg-cream px-5 py-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}