import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/lib/site";

type BrandMarkProps = {
  /** Visual size of the wordmark block. */
  variant?: "header" | "footer" | "admin";
  /** Render as a link to the home page. */
  href?: string | null;
  className?: string;
};

const sizes = {
  header: { height: 44, width: 66 },
  footer: { height: 48, width: 72 },
  admin: { height: 36, width: 54 },
} as const;

/**
 * ISNESI brand lockup: the supplied logo plus an accessible wordmark.
 *
 * The logo image is decorative (the wordmark carries the meaning), so it is
 * hidden from assistive technology to avoid duplicate announcements.
 */
export function BrandMark({ variant = "header", href = "/", className }: BrandMarkProps) {
  const dimensions = sizes[variant];

  const content = (
    <span className={["inline-flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <Image
        src="/brand/logo.png"
        alt=""
        aria-hidden="true"
        width={dimensions.width}
        height={dimensions.height}
        className="h-auto w-auto"
        style={{ height: dimensions.height, width: "auto" }}
        priority={variant === "header"}
      />
      <span className="sr-only">{siteConfig.name}</span>
      <span aria-hidden="true" className="hidden text-sm font-semibold tracking-[0.18em] sm:block">
        {siteConfig.name}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      aria-label={`${siteConfig.name} home`}
    >
      {content}
    </Link>
  );
}