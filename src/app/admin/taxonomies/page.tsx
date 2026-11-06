import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import {
  listAdminCategories,
  listAdminTags,
  type AdminTaxonomyItem,
} from "@/features/taxonomy/admin-queries";
import { TaxonomyForm } from "@/features/taxonomy/taxonomy-form";
export const metadata: Metadata = { title: "Categories & tags" };
export const dynamic = "force-dynamic";
const COLUMNS: DataTableColumn[] = [
  { key: "term", label: "Term" },
  { key: "usage", label: "Used by", align: "center" },
  { key: "actions", label: "Actions", align: "right", srOnly: true },
];
function TaxonomyTable({
  items,
  basePath,
  caption,
  emptyTitle,
}: {
  items: AdminTaxonomyItem[] | null;
  basePath: string;
  caption: string;
  emptyTitle: string;
}) {
  if (items === null) {
    return (
      <p className="text-sm text-ink-muted">
        {" "}
        The database is not connected, so terms cannot be loaded. Configure
        Supabase and reload.{" "}
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="Create the first one above."
      />
    );
  }
  return (
    <DataTable columns={COLUMNS} caption={caption} isEmpty={false}>
      {" "}
      {items.map((item) => (
        <tr key={item.id} className="border-t border-line/70">
          {" "}
          <td className="px-3 py-3 align-top">
            {" "}
            <p className="font-bold text-ink">
              {item.label ?? "(no label)"}
            </p>{" "}
            <p className="font-mono text-xs text-ink-muted">{item.key}</p>{" "}
          </td>{" "}
          <td className="px-3 py-3 text-center align-top text-xs text-ink-muted">
            {item.usageCount}
          </td>{" "}
          <td className="px-3 py-3 text-right align-top">
            {" "}
            <Link
              href={`${basePath}/${item.id}`}
              className="font-bold text-brand hover:underline"
            >
              {" "}
              Edit{" "}
            </Link>{" "}
          </td>{" "}
        </tr>
      ))}{" "}
    </DataTable>
  );
}
export default async function AdminTaxonomiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { allowed } = await requirePermission(
    "content.edit_any",
    "/admin/taxonomies",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the content.edit_any permission."
      />
    );
  }
  const { q } = await searchParams;
  const search = (q ?? "").trim().slice(0, 120);
  const [categories, tags] = await Promise.all([
    listAdminCategories(search),
    listAdminTags(search),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      {" "}
      <AdminPageHeader
        eyebrow="Website"
        title="Categories & tags"
        description="Author the terms that group stories and news, then attach them to an item from the story editor."
      />{" "}
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/taxonomies"
          filters={[
            {
              type: "search",
              name: "q",
              label: "Search terms",
              placeholder: "key or label",
              value: search,
            },
          ]}
          submitLabel="Search"
        />{" "}
      </div>{" "}
      <Card className="mb-6 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            New category{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <TaxonomyForm kind="category" />{" "}
        </CardContent>{" "}
      </Card>{" "}
      <Card className="mb-6 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Categories
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <TaxonomyTable
            items={categories}
            basePath="/admin/taxonomies/category"
            caption="Categories"
            emptyTitle="No categories yet."
          />{" "}
        </CardContent>{" "}
      </Card>{" "}
      <Card className="mb-6 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            New tag
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <TaxonomyForm kind="tag" />{" "}
        </CardContent>{" "}
      </Card>{" "}
      <Card className="border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Tags
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <TaxonomyTable
            items={tags}
            basePath="/admin/taxonomies/tag"
            caption="Tags"
            emptyTitle="No tags yet."
          />{" "}
        </CardContent>{" "}
      </Card>{" "}
    </div>
  );
}
