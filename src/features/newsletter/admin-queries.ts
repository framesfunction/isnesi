import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin reads for the newsletter module. RLS enforces `newsletter.manage`;
 * there is no public read path for subscribers at all.
 */

export type AdminSubscriberListItem = {
  id: string;
  email: string;
  fullName: string | null;
  status: string;
  locale: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type AdminConsent = {
  id: string;
  status: string;
  source: string;
  policyVersion: string | null;
  evidenceReference: string | null;
  recordedAt: string;
  revokedAt: string | null;
};

export type AdminSegment = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  member: boolean;
};

export type AdminSubscriberDetail = AdminSubscriberListItem & {
  consents: AdminConsent[];
  segments: AdminSegment[];
};

export type AdminCampaignListItem = {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduledAt: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type AdminCampaignDetail = AdminCampaignListItem & {
  body: unknown;
  createdBy: string | null;
  events: { id: number; eventType: string; occurredAt: string; providerEventId: string | null }[];
};

type SubscriberRow = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  locale: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};

export async function listAdminSubscribers(
  search: string,
  status: string,
): Promise<AdminSubscriberListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("newsletter_subscribers")
    .select("id, email, full_name, status, locale, confirmed_at, unsubscribed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (search) query = query.ilike("email", `%${search}%`);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin subscribers unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => {
    const item = row as SubscriberRow;
    return {
      id: item.id,
      email: item.email,
      fullName: item.full_name,
      status: item.status,
      locale: item.locale,
      confirmedAt: item.confirmed_at,
      unsubscribedAt: item.unsubscribed_at,
      createdAt: item.created_at,
    };
  });
}

export async function getAdminSubscriber(
  subscriberId: string,
): Promise<AdminSubscriberDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: subscriber, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, full_name, status, locale, confirmed_at, unsubscribed_at, created_at")
    .eq("id", subscriberId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin subscriber unavailable", { subscriberId, code: error.code });
    return null;
  }
  if (!subscriber) return null;

  const { data: consents } = await supabase
    .from("newsletter_consents")
    .select("id, status, source, policy_version, evidence_reference, recorded_at, revoked_at")
    .eq("subscriber_id", subscriberId)
    .order("recorded_at", { ascending: false });

  const { data: segments } = await supabase
    .from("newsletter_segments")
    .select("id, name, description, status")
    .eq("status", "active")
    .order("name", { ascending: true });

  const { data: memberships } = await supabase
    .from("newsletter_segment_members")
    .select("segment_id")
    .eq("subscriber_id", subscriberId);

  const memberIds = new Set((memberships ?? []).map((row) => row.segment_id));

  const base = subscriber as SubscriberRow;

  return {
    id: base.id,
    email: base.email,
    fullName: base.full_name,
    status: base.status,
    locale: base.locale,
    confirmedAt: base.confirmed_at,
    unsubscribedAt: base.unsubscribed_at,
    createdAt: base.created_at,
    consents: (consents ?? []).map((consent) => ({
      id: consent.id,
      status: consent.status,
      source: consent.source,
      policyVersion: consent.policy_version,
      evidenceReference: consent.evidence_reference,
      recordedAt: consent.recorded_at,
      revokedAt: consent.revoked_at,
    })),
    segments: (segments ?? []).map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
      status: segment.status,
      member: memberIds.has(segment.id),
    })),
  };
}

export async function listAdminCampaigns(): Promise<AdminCampaignListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .select("id, name, subject, status, scheduled_at, approved_at, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("[isnesi] admin campaigns unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    subject: row.subject,
    status: row.status,
    scheduledAt: row.scheduled_at,
    approvedAt: row.approved_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }));
}

export async function getAdminCampaign(campaignId: string): Promise<AdminCampaignDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("newsletter_campaigns")
    .select("id, name, subject, body, status, scheduled_at, approved_at, sent_at, created_by, created_at")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin campaign unavailable", { campaignId, code: error.code });
    return null;
  }
  if (!campaign) return null;

  const { data: events } = await supabase
    .from("newsletter_events")
    .select("id, event_type, occurred_at, provider_event_id")
    .eq("campaign_id", campaignId)
    .order("occurred_at", { ascending: false })
    .limit(50);

  return {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    status: campaign.status,
    scheduledAt: campaign.scheduled_at,
    approvedAt: campaign.approved_at,
    sentAt: campaign.sent_at,
    createdAt: campaign.created_at,
    body: campaign.body,
    createdBy: campaign.created_by,
    events: (events ?? []).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      occurredAt: event.occurred_at,
      providerEventId: event.provider_event_id,
    })),
  };
}
