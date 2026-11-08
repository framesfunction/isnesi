import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminContent } from "@/features/editorial/admin-queries";
import { StoriesListClient } from "@/components/admin/stories-list-client";

export const metadata: Metadata = { title: "Stories & news" };
export const dynamic = "force-dynamic";

type PageSearchParams = { q?: string; type?: string; status?: string };

export default async function AdminStoriesListPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { allowed } = await requirePermission(
    "content.create",
    "/admin/stories",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the content.create permission."
      />
    );
  }
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const type = (params.type ?? "").trim();
  const status = (params.status ?? "").trim();
  const items = await listAdminContent(search, type, status);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Website"
        title="Stories & news"
        description="Draft, submit, review and publish stories, news, announcements and policy notices."
      />
      <StoriesListClient items={items} search={search} type={type} status={status} />
    </div>
  );
}
