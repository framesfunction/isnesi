export const siteConfig = {
  name: "ISNESI",
  legalName: "ISNESI",
  tagline: "We Leave No Child Behind.",
  description:
    "ISNESI helps every child learn, belong and thrive through inclusive education and community-led support.",
  defaultLocale: "en" as const,
  locales: ["en", "fr"] as const,
  currency: "XAF" as const,
  themeColor: "#1B3FA0",
} as const;

export type SiteLocale = (typeof siteConfig.locales)[number];

export type PublicNavItem = {
  label: string;
  href: string;
  description: string;
};

/**
 * The public navigation is mirrored in the `navigation_menus` CMS table so that
 * staff can manage it. This constant is the safe fallback used when the database
 * is unreachable or the menu has not been configured yet.
 */
export const publicNavigation: PublicNavItem[] = [
  { label: "About", href: "/about", description: "Who we are and why we exist" },
  { label: "Programmes", href: "/programmes", description: "The work we deliver" },
  { label: "Impact", href: "/impact", description: "What our work changes" },
  { label: "Stories & News", href: "/stories", description: "From our community" },
  { label: "Get Involved", href: "/get-involved", description: "Volunteer, partner or fundraise" },
  { label: "Partners", href: "/partners", description: "Organisations working with us" },
  { label: "Contact", href: "/contact", description: "Talk to the ISNESI team" },
];

export const primaryCallsToAction = {
  donate: { label: "Donate", href: "/donate" },
  signIn: { label: "Staff sign in", href: "/login" },
} as const;
