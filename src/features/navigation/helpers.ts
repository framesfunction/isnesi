/**
 * Pure support code for the Navigation & footer module.
 *
 * Kept free of any network access so the "does this link resolve?" rule can be
 * unit-tested. It lets the admin list flag a menu entry that points at a page
 * which is no longer published (for example after a slug change or archive)
 * instead of letting it 404 silently on the public site.
 */

/** Public routes the application serves itself, independent of the CMS pages table. */
export const STATIC_PUBLIC_PATHS: readonly string[] = [
  "/",
  "/about",
  "/programmes",
  "/impact",
  "/stories",
  "/get-involved",
  "/partners",
  "/contact",
  "/donate",
  "/kids-corner",
  "/no-access",
  "/login",
];

/** External links are validated by the form schema; they always "resolve" here. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/** Normalise an internal href to a bare path: drop query/hash and a trailing slash. */
export function normaliseInternalPath(href: string): string {
  const path = href.trim().split(/[?#]/)[0] ?? "";
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const trimmed = withLeading.replace(/\/+$/, "");
  return trimmed.length === 0 ? "/" : trimmed;
}

/**
 * True when an internal href points at a real public route: the site root, a
 * known static route, or a currently published CMS page slug.
 */
export function isResolvableInternalHref(
  href: string,
  publishedPageSlugs: readonly string[],
): boolean {
  if (isExternalHref(href)) return true;

  const path = normaliseInternalPath(href);
  if (path === "/") return true;
  if (STATIC_PUBLIC_PATHS.includes(path)) return true;

  const slug = path.slice(1);
  return publishedPageSlugs.includes(slug);
}