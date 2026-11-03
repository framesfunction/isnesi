import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Web app manifest (served at /manifest.webmanifest).
 *
 * The installable app covers the PUBLIC website only. The admin application is
 * deliberately excluded from offline use, so no admin route is precached and the
 * service worker bypasses /admin entirely.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FFFDF5",
    theme_color: siteConfig.themeColor,
    lang: siteConfig.defaultLocale,
    categories: ["education", "nonprofit", "social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Programmes",
        short_name: "Programmes",
        description: "Explore ISNESI programmes",
        url: "/programmes",
      },
      {
        name: "Get involved",
        short_name: "Get involved",
        description: "Volunteer, partner or fundraise",
        url: "/get-involved",
      },
      {
        name: "Donate",
        short_name: "Donate",
        description: "Support ISNESI",
        url: "/donate",
      },
    ],
  };
}