import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

/**
 * Pin the Turbopack workspace root to this project. Without it, a lockfile in a
 * parent directory makes Next.js widen the module resolution scope (and warn
 * about it) instead of using this repository.
 */
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

type ImagePattern = {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
};

/**
 * Derive the Supabase Storage host at build time so that `next/image` can
 * optimise public media without allowing arbitrary remote hosts.
 * Missing or malformed configuration simply disables remote optimisation.
 */
const remotePatterns: ImagePattern[] = [];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    remotePatterns.push({
      protocol: parsed.protocol === "http:" ? "http" : "https",
      hostname: parsed.hostname,
      pathname: "/storage/v1/object/public/**",
    });
  } catch {
    // Ignore malformed URLs; images will fall back to unoptimised rendering.
  }
}

/** Baseline security headers. A strict CSP with nonces is added before launch. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Tailwind CSS v4 is processed by Turbopack (the default builder in Next 16).
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Only Supabase Storage public objects are optimised; everything else is blocked.
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // The service worker must never be served stale, and it controls the
        // whole origin rather than only the /sw.js path.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Admin, API and auth responses are private by default.
        source: "/:path(admin|api|auth)/:rest*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
