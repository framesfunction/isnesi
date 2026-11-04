import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { DataTable } from "@/components/admin/data-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PAGE_TYPES } from "@/lib/validation/cms";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminPages, type AdminPageListItem } from "@/features/pages/admin-queries";
import { createPageAction } from "@/features/pages/actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Pages & sections" };

export const dynamic = "force-dynamic";

const JSON_PLACEHOLDER = '[{ "type": "paragraph", "text": "Opening paragraph" }]';

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

function PageRow({ page, hrefBase }: { page: AdminPageListItem; hrefBase: string }) {
  return (
    <tr className="border-t border-line/70">
      <td className="px-3 py-3 align-top">
        <p className="font-bold text-ink">{page.title ?? "(untitled)"}</p>
        <p className="font-mono text-xs text-ink-muted">/{page.slug}</p>
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">{page.pageType}</td>
      <td className="px-3 py-3 align-top">
        <StatusBadge status={page.status} />
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {page.showInNavigation ? "In navigation" : "Hidden"}
      </td>
      <td className="px-3 py-3 align-top text-xs text-ink-muted">{formatDate(page.updatedAt)}</td>
      <td className="px-3 py-3 text-right align-top">
        <Link
          href={`${hrefBase}/${page.id}`}
          className="font-bold text-brand hover:underline"
        >
          Edit
        </Link>
      </td>
    </tr>
  );
}

export default async function AdminPagesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { allowed } = await requirePermission("pages.manage", "/admin/pages");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the pages.manage permission."
      />
    );
  }

  const { q } = await searchParams;
  const search = (q ?? "").trim().slice(0, 120);
  const pages = await listAdminPages(search);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Website"
        title="Pages & sections"
        description="Create public pages, edit their ordered sections and translations, and control what is published."
      />

      <div className="mb-6">
        <ListToolbar
          action="/admin/pages"
          filters={[
            {
              type: "search",
              name: "q",
              label: "Search by title",
              placeholder: "e.g. volunteer",
              value: search,
            },
          ]}
          submitLabel="Search"
        />
      </div>

      {pages === null ? (
        <Card className="mb-6 border-2 border-coral/40">
          <CardContent className="pt-5 text-sm text-ink-muted">
            The database is not connected, so the page list could not be loaded. Configure Supabase
            and refresh.
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              Pages ({pages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "title", label: "Title / slug" },
                { key: "type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "nav", label: "Navigation" },
                { key: "updated", label: "Updated" },
                { key: "actions", label: "Actions", align: "right", srOnly: true },
              ]}
              isEmpty={pages.length === 0}
              empty={
                <EmptyState
                  title="No pages yet."
                  description="Create the first page with the form below."
                />
              }
            >
              {pages.map((page) => (
                <PageRow key={page.id} page={page} hrefBase="/admin/pages" />
              ))}
            </DataTable>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Create a page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={createPageAction} submitLabel="Create page">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Slug</span>
                <input
                  type="text"
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="e.g. how-we-work"
                  className="min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Page type</span>
                <select
                  name="pageType"
                  className="min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
                >
                  {PAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>English title</span>
                <input
                  type="text"
                  name="titleEn"
                  required
                  className="min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Excerpt (optional)</span>
                <input
                  type="text"
                  name="excerptEn"
                  className="min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
                />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <label className={FIELD_LABELS}>
                <span>Body (JSON blocks)</span>
                <textarea
                  name="bodyEnBlocks"
                  rows={8}
                  defaultValue={JSON_PLACEHOLDER}
                  spellCheck={false}
                  className="rounded-xl border-2 border-line bg-white px-3 py-2 font-mono text-xs text-ink"
                />
              </label>
              <p className="text-xs text-ink-muted">
                Block types: heading (level 2 or 3), paragraph, list, quote, callout. Example:
                <code className="ml-1 font-mono">{JSON_PLACEHOLDER}</code>
              </p>
              <details className="text-xs text-ink-muted">
                <summary className="font-bold uppercase tracking-[0.1em]">SEO (optional)</summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <label className={FIELD_LABELS}>
                    <span>SEO title</span>
                    <input
                      type="text"
                      name="seoTitleEn"
                      className="min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
                    />
                  </label>
                  <label className={FIELD_LABELS}>
                    <span>SEO description</span>
                    <input
                      type="text"
                      name="seoDescriptionEn"
                      className="min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink"
                    />
                  </label>
                </div>
              </details>
            </div>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
