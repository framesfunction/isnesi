"use client";

import Link from "next/link";
import { useState } from "react";
import { DataTable } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockEditor } from "@/components/admin/block-editor";
import { PAGE_TYPES } from "@/lib/validation/cms";
import { formatDate } from "@/lib/format";
import type { AdminPageListItem } from "@/features/pages/admin-queries";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

function PageRow({
  page,
  hrefBase,
  selected,
  onToggle,
}: {
  page: AdminPageListItem;
  hrefBase: string;
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const isSelected = selected.includes(page.id);
  return (
    <tr className="border-t border-line/70">
      {" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggle(page.id, e.target.checked)}
          className="size-4 rounded border border-line text-brand"
        />
      </td>
      {" "}
      <td className="px-3 py-3 align-top min-w-0">
        {" "}
        <p className="font-bold text-ink truncate">{page.title ?? "(untitled)"}</p>{" "}
        <p className="font-mono text-xs text-ink-muted truncate">/{page.slug}</p>{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {page.pageType}
      </td>{" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <StatusBadge status={page.status} />{" "}
      </td>
      {" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {page.showInNavigation ? "In navigation" : "Hidden"}{" "}
      </td>
      {" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {formatDate(page.updatedAt)}
      </td>
      {" "}
      <td className="px-3 py-3 text-right align-top">
        {" "}
        <Link
          href={`${hrefBase}/${page.id}`}
          className="font-bold text-brand hover:underline"
        >
          {" "}
          Edit{" "}
        </Link>
      </td>
    </tr>
  );
}

export function PagesListClient({
  pages,
  search,
}: {
  pages: AdminPageListItem[] | null;
  search: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        {" "}
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
        />{" "}
      </div>{" "}
      {pages === null ? (
        <Card className="mb-6 border border-coral/40">
          {" "}
          <CardContent className="pt-5 text-sm text-ink-muted">
            {" "}
            The database is not connected, so the page list could not be loaded.
            Configure Supabase and refresh.{" "}
          </CardContent>{" "}
        </Card>
      ) : (
        <>
          <Card className="mb-8">
            {" "}
            <CardHeader>
              {" "}
              <CardTitle className="font-display text-base font-extrabold text-brand">
                {" "}
                Pages ({pages.length}){" "}
              </CardTitle>
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <DataTable
                columns={[
                  { key: "title", label: "Title / slug" },
                  { key: "type", label: "Type" },
                  { key: "status", label: "Status" },
                  { key: "nav", label: "Navigation" },
                  { key: "updated", label: "Updated" },
                  {
                    key: "actions",
                    label: "Actions",
                    align: "right",
                    srOnly: true,
                  },
                ]}
                isEmpty={pages.length === 0}
                empty={
                  <EmptyState
                    title="No pages yet."
                    description="Create the first page with the form below."
                    whatWillBeHere="Published pages such as About, Contact, and any page you add yourself."
                    whyItMatters="Pages are the screens that make up your public website. Each page holds sections — headings, paragraphs, lists, images — that visitors read."
                    getStartedCta={{ label: "Create your first page", href: "/admin/pages" }}
                    helpText={{ label: "Read the Pages & sections guide", href: "/admin/help" }}
                  />
                }
                bulkActions={{
                  label: "Selected pages",
                  items: [
                    {
                      label: "Publish selected",
                      onSelect: (ids) => {
                        setSelected([]);
                        console.log("Publish", ids);
                      },
                      disabled: selected.length === 0,
                    },
                    {
                      label: "Archive selected",
                      onSelect: (ids) => {
                        setSelected([]);
                        console.log("Archive", ids);
                      },
                      disabled: selected.length === 0,
                      variant: "danger",
                    },
                  ],
                  selected,
                  totalItems: pages.length,
                  onToggleAll: (checked) => {
                    setSelected(
                      checked ? pages.map((p) => p.id) : [],
                    );
                  },
                  onToggleItem: toggleSelect,
                }}
              >
                {" "}
                {pages.map((page) => (
                  <PageRow
                    key={page.id}
                    page={page}
                    hrefBase="/admin/pages"
                    selected={selected}
                    onToggle={toggleSelect}
                  />
                ))}{" "}
              </DataTable>{" "}
            </CardContent>{" "}
          </Card>
          <Card className="border border-line">
            {" "}
            <CardHeader>
              {" "}
              <CardTitle className="font-display text-base font-extrabold text-brand">
                {" "}
                Create a page{" "}
              </CardTitle>
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <form
                className="grid gap-4 sm:grid-cols-2"
              >
                {" "}
                <div className="grid gap-4 sm:grid-cols-2">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Slug</span>{" "}
                    <input
                      type="text"
                      name="slug"
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      placeholder="e.g. how-we-work"
                      className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                    />{" "}
                  </label>
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Page type</span>{" "}
                    <select
                      name="pageType"
                      className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                    >
                      {" "}
                      {PAGE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {" "}
                          {type}{" "}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>English title</span>{" "}
                    <input
                      type="text"
                      name="titleEn"
                      required
                      className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                    />{" "}
                  </label>
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Excerpt (optional)</span>{" "}
                    <input
                      type="text"
                      name="excerptEn"
                      className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                    />{" "}
                  </label>
                </div>
                <div className="mt-4 space-y-3">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Body (content blocks)</span>{" "}
                    <BlockEditor name="bodyEnBlocks" value={[]} />
                    <p className="text-xs text-ink-muted">
                      {" "}
                      Blocks are heading, paragraph, list, quote, callout and
                      image. Images are picked from the media library — no code
                      required.{" "}
                    </p>
                    <details className="text-xs text-ink-muted">
                      {" "}
                      <summary className="font-bold uppercase tracking-[0.1em]">
                        SEO (optional)
                      </summary>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {" "}
                        <label className={FIELD_LABELS}>
                          {" "}
                          <span>SEO title</span>{" "}
                          <input
                            type="text"
                            name="seoTitleEn"
                            className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                          />{" "}
                        </label>
                        <label className={FIELD_LABELS}>
                          {" "}
                          <span>SEO description</span>{" "}
                          <input
                            type="text"
                            name="seoDescriptionEn"
                            className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
                          />{" "}
                        </label>
                      </div>
                    </details>
                  </label>
                </div>
              </form>
            </CardContent>{" "}
          </Card>
        </>
      )}
    </div>
  );
}
