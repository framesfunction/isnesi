import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminPages } from "@/features/pages/admin-queries";
import { PagesListClient } from "@/components/admin/pages-list-client";

export const metadata: Metadata = { title: "Pages & sections" };
export const dynamic = "force-dynamic";

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
      <PagesListClient pages={pages} search={search} />
    </div>
  );
}
