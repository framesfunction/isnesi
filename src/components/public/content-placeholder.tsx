type ContentPlaceholderProps = {
  /** Slug the admin CMS uses for this page. */
  cmsSlug: string;
  /** What this page will present once content is published. */
  summary: string;
  /** Editorial steps shown to staff. */
  steps?: string[];
};

/**
 * Shown where a public page is CMS-driven but has no published content yet.
 *
 * It is explicit about why the page is sparse rather than inventing placeholder
 * copy, and it tells staff exactly where the content is managed.
 */
export function ContentPlaceholder({ cmsSlug, summary, steps }: ContentPlaceholderProps) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand/30 bg-white p-8">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-accent">Awaiting published content</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-brand">
        This page is connected to the CMS
      </h2>
      <p className="mt-3 max-w-2xl text-muted">{summary}</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-brand-soft p-4">
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">CMS page slug</dt>
          <dd className="mt-1 font-mono text-sm text-brand">{cmsSlug}</dd>
        </div>
        <div className="rounded-2xl bg-brand-soft p-4">
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Managed in</dt>
          <dd className="mt-1 text-sm text-brand">Admin → Pages &amp; sections</dd>
        </div>
      </dl>

      {steps && steps.length > 0 ? (
        <ol className="mt-6 grid gap-2 text-sm text-ink">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      <p className="mt-6 text-xs text-muted">
        Nothing here is hard-coded: as soon as an editor publishes this page, the public site renders
        the published sections instead of this notice.
      </p>
    </div>
  );
}