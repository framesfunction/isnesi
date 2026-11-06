import Link from "next/link";

/**
 * Public pagination.
 *
 * The URL is the state: every page range is a plain link, so pagination keeps
 * working without JavaScript and every page is a shareable address. Renders
 * nothing when everything fits on one page.
 */
export function PublicPagination({
  page,
  totalPages,
  href,
  label = "Pagination",
}: {
  page: number;
  totalPages: number;
  /** Builds the address for a page number; page 1 may be the bare URL. */
  href: (page: number) => string;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = windowPages(page, totalPages);

  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-line bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          ← Previous
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-line/70 bg-white/60 px-4 text-sm font-bold text-ink-muted/60"
        >
          ← Previous
        </span>
      )}

      {pages.map((item, index) =>
        item === null ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-sm font-bold text-ink-muted"
          >
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className="inline-grid min-h-11 min-w-11 place-items-center rounded-full border-2 border-brand bg-brand px-4 text-sm font-bold text-white"
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className="inline-grid min-h-11 min-w-11 place-items-center rounded-full border-2 border-line bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-line bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
        >
          Next →
        </Link>
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-line/70 bg-white/60 px-4 text-sm font-bold text-ink-muted/60"
        >
          Next →
        </span>
      )}

      <span className="sr-only">{`Page ${page} of ${totalPages}`}</span>
    </nav>
  );
}

/** Page window with ellipsis gaps: always shows the first, last and current pages. */
function windowPages(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const window = new Set<number>([1, 2, page - 1, page, page + 1, totalPages - 1, totalPages]);
  const ordered = [...window]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  return ordered.flatMap((value, index) => {
    const previous = ordered[index - 1];
    const gap: (number | null)[] = index > 0 && value - previous > 1 ? [null] : [];
    return [...gap, value];
  });
}
