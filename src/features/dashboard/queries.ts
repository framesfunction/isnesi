import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type DashboardMetric = {
  key: string;
  label: string;
  value: number | null;
  hint: string;
  href: string;
};

export type DashboardSnapshot = {
  generatedAt: string;
  metrics: DashboardMetric[];
  /** True when the database is unreachable or not configured. */
  unavailable: boolean;
};

type CountResult = {
  count: number | null;
  error: { code?: string; message?: string } | null;
};

const HEAD = { count: "exact" as const, head: true };

function metricValue(result: CountResult, label: string): number | null {
  if (result.error) {
    // RLS returns zero rows rather than an error for unauthorised reads, so an
    // error here means the query itself failed.
    console.warn("[isnesi] dashboard metric failed", { label, code: result.error.code });
    return null;
  }
  return result.count ?? 0;
}

/**
 * Dashboard aggregates.
 *
 * Everything here is a count. Safeguarding casework is deliberately excluded:
 * the private schema is not reachable from the browser or an ordinary admin
 * session, and only aggregated, permission-gated indicators may appear here.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const generatedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { generatedAt, metrics: [], unavailable: true };
  }

  const supabase = await createClient();

  const [
    publishedPages,
    draftPages,
    publishedStories,
    openEnquiries,
    unassignedEnquiries,
    subscribedContacts,
    confirmedDonations,
  ] = await Promise.all([
    supabase.from("pages").select("*", HEAD).eq("status", "published"),
    supabase.from("pages").select("*", HEAD).in("status", ["draft", "in_review"]),
    supabase.from("content_items").select("*", HEAD).eq("status", "published"),
    supabase
      .from("general_enquiries")
      .select("*", HEAD)
      .in("status", ["new", "triaged", "assigned", "in_progress", "waiting"]),
    supabase
      .from("general_enquiries")
      .select("*", HEAD)
      .eq("status", "new")
      .is("assigned_to", null),
    supabase.from("newsletter_subscribers").select("*", HEAD).eq("status", "subscribed"),
    supabase.from("donations").select("*", HEAD).eq("payment_status", "succeeded"),
  ]);

  const metrics: DashboardMetric[] = [
    {
      key: "published-pages",
      label: "Published pages",
      value: metricValue(publishedPages, "published pages"),
      hint: "Pages currently live on the public website",
      href: "/admin/pages",
    },
    {
      key: "draft-pages",
      label: "Drafts & in review",
      value: metricValue(draftPages, "draft pages"),
      hint: "Pages awaiting completion or review",
      href: "/admin/pages",
    },
    {
      key: "published-stories",
      label: "Published stories",
      value: metricValue(publishedStories, "published stories"),
      hint: "Stories and news visible to the public",
      href: "/admin/stories",
    },
    {
      key: "open-enquiries",
      label: "Open enquiries",
      value: metricValue(openEnquiries, "open enquiries"),
      hint: "Ordinary enquiries still being handled",
      href: "/admin/enquiries",
    },
    {
      key: "unassigned-enquiries",
      label: "Unassigned enquiries",
      value: metricValue(unassignedEnquiries, "unassigned enquiries"),
      hint: "New enquiries waiting for an owner",
      href: "/admin/enquiries",
    },
    {
      key: "newsletter-subscribers",
      label: "Confirmed subscribers",
      value: metricValue(subscribedContacts, "newsletter subscribers"),
      hint: "Contacts with confirmed marketing consent",
      href: "/admin/newsletter",
    },
    {
      key: "confirmed-donations",
      label: "Confirmed donations",
      value: metricValue(confirmedDonations, "confirmed donations"),
      hint: "Transactions settled by the payment provider",
      href: "/admin/donations",
    },
  ];

  return { generatedAt, metrics, unavailable: false };
}