import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getAdminTag } from "@/features/taxonomy/admin-queries";
import { deleteTagAction } from "@/features/taxonomy/actions";
import { TaxonomyForm } from "@/features/taxonomy/taxonomy-form";

export const metadata: Metadata = { title: "Edit tag" };

export const dynamic = "force-dynamic";

export default async function AdminTagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
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

  const { tagId } = await params;
  const tag = await getAdminTag(tagId);
  if (!tag) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/admin/taxonomies"
          className="text-sm font-bold text-brand hover:underline"
        >
          ← Back to categories &amp; tags
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Categories & tags"
        title={tag.label ?? tag.key}
        description={`Key: ${tag.key}`}
      />

      <Card className="border border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Edit tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaxonomyForm kind="tag" item={tag} />
        </CardContent>
      </Card>

      <Card className="mt-6 border border-coral/40">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Delete tag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Deleting removes this tag from every story that used it. The stories
            themselves are not affected.
          </p>
          <div className="mt-3">
            <ActionButton
              action={deleteTagAction}
              hidden={{ tagId: tag.id }}
              label="Delete tag"
              variant="danger"
              confirm="Delete this tag permanently? It will be removed from every story that uses it."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
