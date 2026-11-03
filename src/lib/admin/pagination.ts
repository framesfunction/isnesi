/**
 * Server-driven list helpers: search-param parsing and link building.
 *
 * Every admin list screen reads its page, page size, search term, sort column
 * and filters from the URL. That keeps lists shareable, bookmarkable and
 * usable without JavaScript, and it means the same helpers can be reused by
 * every module instead of each one inventing its own state.
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 120;

export type ListParams = {
  /** One-based page number, never below 1. */
  page: number;
  /** Clamped to `1..MAX_PAGE_SIZE`. */
  pageSize: number;
  /** `(page - 1) * pageSize`, ready for `.range(offset, offset + pageSize - 1)`. */
  offset: number;
  /** Trimmed, length-capped search term (empty string when absent). */
  q: string;
  /** Validated sort column; falls back to `defaultSort`. */
  sort: string;
  dir: "asc" | "desc";
};

export type ParseListOptions = {
  pageSize?: number;
  /** Allow-list of sortable columns. Anything else is rejected. */
  allowedSort?: readonly string[];
  defaultSort?: string;
  defaultDir?: "asc" | "desc";
};

/** Repeated query params arrive as arrays; the first value wins. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseListParams(input: SearchParams, options: ParseListOptions = {}): ListParams {
  const requestedSize = toInt(first(input.pageSize), options.pageSize ?? DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(Math.max(requestedSize, 1), MAX_PAGE_SIZE);

  const page = Math.max(toInt(first(input.page), 1), 1);

  const q = (first(input.q) ?? "").trim().slice(0, MAX_SEARCH_LENGTH);

  const allowedSort = options.allowedSort ?? [];
  const requestedSort = first(input.sort);
  const sort =
    requestedSort && allowedSort.includes(requestedSort)
      ? requestedSort
      : (options.defaultSort ?? "created_at");

  const requestedDir = first(input.dir);
  const dir: "asc" | "desc" =
    requestedDir === "asc" || requestedDir === "desc"
      ? requestedDir
      : (options.defaultDir ?? "desc");

  return { page, pageSize, offset: (page - 1) * pageSize, q, sort, dir };
}

/**
 * Build a query string from the current params overridden by `next`.
 *
 * `null`/`undefined`/`""` deletes a key (so clearing a filter drops it from the
 * URL instead of leaving `?q=` behind). Order is preserved, so a link that only
 * changes `page` keeps the rest of the URL stable.
 */
export function buildQuery(
  next: Record<string, string | number | null | undefined>,
  base: SearchParams = {},
): string {
  const merged = new URLSearchParams();

  for (const [key, value] of Object.entries(base)) {
    const single = first(value);
    if (single !== undefined && single !== "") merged.set(key, single);
  }

  for (const [key, value] of Object.entries(next)) {
    if (value === null || value === undefined || value === "") {
      merged.delete(key);
    } else {
      merged.set(key, String(value));
    }
  }

  const query = merged.toString();
  return query ? `?${query}` : "";
}

/** Total pages for a result set; always at least one so the UI never shows "0 pages". */
export function pageCount(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(Math.ceil(total / pageSize), 1);
}
