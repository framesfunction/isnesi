import Link from "next/link";
import {
  buildQuery,
  pageCount,
  type SearchParams,
} from "@/lib/admin/pagination";
const linkClass =
  "rounded-full border border-line bg-white px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const disabledClass =
  "rounded-full border border-line bg-muted px-4 py-2 text-xs font-bold text-ink-muted";
/** * Pagination controls built from the current URL. * * Renders nothing when there is a single page, and uses `aria-disabled` spans * (not dead links) at the bounds so keyboard and screen-reader users are not * sent to a page that does not exist. */ export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: SearchParams;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = pageCount(total, pageSize);
  if (pages <= 1) return null;
  const href = (target: number) =>
    `${basePath}${buildQuery({ page: target }, params)}`;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      {" "}
      <p className="text-ink-muted">
        {" "}
        Showing <strong className="text-ink">{from}</strong>–
        <strong className="text-ink">{to}</strong> of{" "}
        <strong className="text-ink">{total}</strong>{" "}
      </p>{" "}
      <div className="flex items-center gap-2">
        {" "}
        {page > 1 ? (
          <Link href={href(page - 1)} rel="prev" className={linkClass}>
            {" "}
            Previous{" "}
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            {" "}
            Previous{" "}
          </span>
        )}{" "}
        <span
          aria-current="page"
          className="px-2 text-xs font-bold text-ink-muted"
        >
          {" "}
          Page {page} of {pages}{" "}
        </span>{" "}
        {page < pages ? (
          <Link href={href(page + 1)} rel="next" className={linkClass}>
            {" "}
            Next{" "}
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            {" "}
            Next{" "}
          </span>
        )}{" "}
      </div>{" "}
    </nav>
  );
}
