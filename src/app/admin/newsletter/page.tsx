import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listAdminCampaigns,
  listAdminSubscribers,
} from "@/features/newsletter/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Newsletter" };
export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const { allowed } = await requirePermission(
    "newsletter.manage",
    "/admin/newsletter",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the newsletter.manage permission."
      />
    );
  }

  const [subscribers, campaigns] = await Promise.all([
    listAdminSubscribers("", ""),
    listAdminCampaigns(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Engagement"
        title="Newsletter"
        description="Subscribers, consent records, campaigns and provider delivery status."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscribers ({subscribers?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!subscribers?.length ? (
              <EmptyState title="No subscribers yet." />
            ) : (
              <ul className="divide-y divide-line">
                {subscribers.slice(0, 20).map((subscriber) => (
                  <li key={subscriber.id} className="py-3">
                    <p className="font-bold text-ink">{subscriber.email}</p>
                    <p className="text-xs text-ink-muted">
                      {subscriber.status} - {formatDateTime(subscriber.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns ({campaigns?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!campaigns?.length ? (
              <EmptyState title="No campaigns yet." />
            ) : (
              <ul className="divide-y divide-line">
                {campaigns.slice(0, 20).map((campaign) => (
                  <li key={campaign.id} className="py-3">
                    <Link
                      href={`/admin/newsletter/campaigns/${campaign.id}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {campaign.status} - {campaign.subject}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
