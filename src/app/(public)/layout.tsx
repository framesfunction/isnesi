import type { ReactNode } from "react";

import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

/**
 * Public website layout.
 *
 * Public content is CMS-driven and changes without a deploy, so pages revalidate
 * every five minutes instead of being served from a build-time snapshot forever.
 */
export const revalidate = 300;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}