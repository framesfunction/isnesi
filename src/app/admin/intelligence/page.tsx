import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardSnapshot } from "@/features/dashboard/queries";
import { getAdminDonationStats, describeVolumes } from "@/features/finance/admin-queries";import { requireAdmin } from "@/lib/auth/guards";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { canAny } from "@/lib/permissions/can";

export const metadata: Metadata = { title: "Business intelligence" };
export const dynamic = "force-dynamic";

function MetricCard({
  title,
  value,
  detail,
  href,
}: {
  title: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full border border-line transition-colors hover:border-brand/50">
        <CardHeader>
          <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-display text-3xl font-extrabold text-brand">{value}</p>
          <p className="mt-2 text-xs text-ink-muted">{detail}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function AdminIntelligencePage() {
  const user = await requireAdmin("/admin/intelligence");
  const snapshot = await getDashboardSnapshot();

  const canViewFinance = canAny(user, ["donations.read", "donations.manage"]);
  const finance = canViewFinance ? await getAdminDonationStats() : null;
  const metrics = new Map(snapshot.metrics.map((metric) => [metric.key, metric.value]));

  const publishedPages = metrics.get("published-pages") ?? 0;
  const drafts = metrics.get("draft-pages") ?? 0;
  const publishedStories = metrics.get("published-stories") ?? 0;
  const openEnquiries = metrics.get("open-enquiries") ?? 0;
  const unassigned = metrics.get("unassigned-enquiries") ?? 0;
  const subscribers = metrics.get("newsletter-subscribers") ?? 0;

  const attention: Array<{ title: string; detail: string; href: string }> = [];
  if (unassigned > 0) {
    attention.push({
      title: `${unassigned} unassigned ${unassigned === 1 ? "enquiry" : "enquiries"}`,
      detail: "Assign an owner so messages do not wait without a responsible person.",
      href: "/admin/enquiries",
    });
  }
  if (drafts > 0) {
    attention.push({
      title: `${drafts} page item${drafts === 1 ? "" : "s"} in draft or review`,
      detail: "Review whether planned website work needs support, approval or a publication date.",
      href: "/admin/pages",
    });
  }
  if (finance && finance.failedCount > 0) {
    attention.push({
      title: `${finance.failedCount} failed donation transaction${finance.failedCount === 1 ? "" : "s"}`,
      detail: "Review failures with Finance so fundraising records remain accurate.",
      href: "/admin/donations",
    });
  }

  if (snapshot.unavailable) {
    return (
      <div className="mx-auto max-w-6xl">
        <AdminPageHeader
          eyebrow="Leadership view"
          title="Business intelligence"
          description="Understand organisational performance and find the issues that need a decision."
        />
        <EmptyState
          title="Business intelligence is not connected"
          description="Configure and connect Supabase, then reload this page to show permission-aware indicators."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Leadership view"
        title="Business intelligence"
        description="A permission-aware view of website reach, public demand, communications, editorial output and fundraising health."
        actions={<Badge variant="success">Live data</Badge>}
      />

      <section aria-labelledby="performance-heading">
        <h2 id="performance-heading" className="mb-3 font-display text-lg font-extrabold text-ink">
          Organisation performance
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <li>
            <MetricCard
              title="Public website"
              value={publishedPages.toLocaleString()}
              detail={`${publishedPages} published page${publishedPages === 1 ? "" : "s"}; ${drafts} draft or review.`}
              href="/admin/pages"
            />
          </li>
          <li>
            <MetricCard
              title="Editorial reach"
              value={publishedStories.toLocaleString()}
              detail="Published stories and news currently available to the public."
              href="/admin/stories"
            />
          </li>
          <li>
            <MetricCard
              title="Public demand"
              value={openEnquiries.toLocaleString()}
              detail={`${openEnquiries} open ${openEnquiries === 1 ? "enquiry" : "enquiries"}; ${unassigned} need assignment.`}
              href="/admin/enquiries"
            />
          </li>
          <li>
            <MetricCard
              title="Audience"
              value={subscribers.toLocaleString()}
              detail="Confirmed newsletter subscribers who have consented to receive updates."
              href="/admin/newsletter"
            />
          </li>
          {finance ? (
            <>
              <li>
                <MetricCard
                  title="Succeeded donations"
                  value={finance.succeededCount.toLocaleString()}
                  detail={`${describeVolumes(finance.succeededVolume, formatCurrency)} confirmed in settlement records.`}
                  href="/admin/donations"
                />
              </li>
              <li>
                <MetricCard
                  title="Fundraising health"
                  value={`${finance.succeededCount + finance.failedCount + finance.pendingCount === 0 ? 0 : Math.round((finance.succeededCount / (finance.succeededCount + finance.failedCount + finance.pendingCount)) * 100)}%`}
                  detail={`${finance.pendingCount} pending and ${finance.refundedCount} refunded transaction${finance.refundedCount === 1 ? "" : "s"}.`}
                  href="/admin/donations"
                />
              </li>
            </>
          ) : (
            <li className="sm:col-span-2">
              <Card className="h-full border border-line">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                    Restricted finance intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-ink-muted">
                  Fundraising volume and transaction health are shown only to staff with donation
                  reading permission.
                </CardContent>
              </Card>
            </li>
          )}
        </ul>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              What needs attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attention.length === 0 ? (
              <p className="text-sm text-leaf-strong">
                No priority operational warning is visible in the current snapshot.
              </p>
            ) : (
              <ul className="grid gap-3">
                {attention.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="block rounded-xl border border-line p-4 hover:border-brand/50"
                    >
                      <p className="font-bold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm text-ink-muted">{item.detail}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border border-line">
          <CardHeader>
            <CardTitle className="font-display text-base font-extrabold text-brand">
              How to use this page
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted">
            <p>Use current figures as a starting point for a management decision.</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Identify a warning or unusually high workload.</li>
              <li>Open the linked module to inspect the underlying records.</li>
              <li>Assign an owner and agree the next action.</li>
              <li>Check this page again at the next management review.</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-ink-muted">
        Snapshot generated {formatDateTime(snapshot.generatedAt)}. Counts reflect current records
        visible to your account under database access rules.
      </p>
    </div>
  );
}
