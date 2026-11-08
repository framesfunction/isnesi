import { clientIp, rateLimit, requirePermissionCaller } from "../_shared/caller.ts";
import { serviceRequest } from "../_shared/safeguarding.ts";
import { buildEmailMessage } from "../_shared/email.ts";

const RATE = { limit: 5, windowMs: 60 * 60 * 1000 };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SENDABLE_STATUSES = new Set(["approved", "scheduled"]);
const BATCH_SIZE = 500;

type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  body: unknown;
  channel: string;
  status: string;
  approved_at: string | null;
  sent_at: string | null;
};

type SubscriberRow = {
  id: string;
  email: string;
  full_name: string | null;
  locale: string | null;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const caller = await requirePermissionCaller(request, "newsletter.manage");
  if (!caller.ok) return caller.response;

  const ip = clientIp(request);
  const rateLimitKey = `newsletter:send:${ip}`;
  if (!rateLimit(rateLimitKey, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { campaignId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const campaignId = typeof body.campaignId === "string" ? body.campaignId : "";
  if (!UUID_RE.test(campaignId)) {
    return Response.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  // Per-campaign rate limit so a retried send cannot duplicate work.
  const campaignRateLimitKey = `newsletter:send:campaign:${campaignId}`;
  if (!rateLimit(campaignRateLimitKey, RATE.limit, RATE.windowMs).ok) {
    return Response.json({ error: "This campaign is already being sent." }, { status: 429 });
  }

  const fetched = await serviceRequest(
    `/rest/v1/newsletter_campaigns?id=eq.${campaignId}&select=id,name,subject,body,channel,status,approved_at,sent_at&limit=1`,
  );
  if (!fetched.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
  const rows = (fetched.data as Array<CampaignRow>) ?? [];
  const campaign = rows[0];
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.channel !== "email") {
    return Response.json(
      { error: `Campaign channel is ${campaign.channel}; only email campaigns can be sent here.` },
      { status: 422 },
    );
  }
  if (!SENDABLE_STATUSES.has(campaign.status)) {
    return Response.json({ error: `Campaign is ${campaign.status}; only approved or scheduled campaigns can be sent.` }, { status: 422 });
  }
  if (!campaign.approved_at) {
    return Response.json({ error: "Approve the campaign before sending it." }, { status: 422 });
  }
  if (campaign.sent_at) {
    return Response.json({ error: "This campaign has already been sent." }, { status: 422 });
  }

  // Fail closed: no provider, no sends.
  const provider = Deno.env.get("NEWSLETTER_PROVIDER");
  if (!provider) {
    return Response.json(
      { error: "Newsletter provider is not configured on the server. Set NEWSLETTER_PROVIDER and connect an adapter before sending." },
      { status: 502 },
    );
  }

  // Mark the campaign as sending so concurrent retries cannot double-queue.
  const now = new Date().toISOString();
  const marked = await serviceRequest(`/rest/v1/newsletter_campaigns?id=eq.${campaignId}`, {
    method: "PATCH",
    body: { status: "sending" },
  });
  if (!marked.ok) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  let queued = 0;
  let offset = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const subscribers = await serviceRequest(
        `/rest/v1/newsletter_subscribers?select=id,email,full_name,locale&status=eq.subscribed&order=created_at.asc&limit=${BATCH_SIZE}&offset=${offset}`,
      );
      if (!subscribers.ok) {
        throw new Error("Subscriber fetch failed");
      }
      const list = (subscribers.data as Array<SubscriberRow>) ?? [];
      if (list.length === 0) {
        hasMore = false;
        break;
      }

      const events = list.map((subscriber) => {
        const name = subscriber.full_name ?? subscriber.email;
        const text = buildEmailMessage({ name, subject: campaign.subject, body: campaign.body });
        if (!text) return null;
        return {
          campaign_id: campaign.id,
          subscriber_id: subscriber.id,
          event_type: "queued",
          provider_key: provider,
          provider_event_id: `send:${campaign.id}:${subscriber.id}`,
          payload: { email: subscriber.email, subject: campaign.subject },
        };
      }).filter((e): e is { campaign_id: string; subscriber_id: string; event_type: string; provider_key: string; provider_event_id: string; payload: { email: string; subject: string } } => e !== null);

      if (events.length > 0) {
        const recorded = await serviceRequest("/rest/v1/newsletter_events", {
          method: "POST",
          headers: { prefer: "resolution=ignore-duplicates" },
          body: events,
        });
        if (!recorded.ok) {
          throw new Error("Event insert failed");
        }
        queued += events.length;
      }

      offset += BATCH_SIZE;
      if (list.length < BATCH_SIZE) {
        hasMore = false;
      }
    }
  } catch {
    // On any failure, roll the campaign back to approved so it can be retried.
    await serviceRequest(`/rest/v1/newsletter_campaigns?id=eq.${campaignId}`, {
      method: "PATCH",
      body: { status: "approved" },
    });
    return Response.json({ error: "Send failed partway through; campaign returned to approved for retry." }, { status: 503 });
  }

  // Mark the campaign as sent only after all batches are queued.
  await serviceRequest(`/rest/v1/newsletter_campaigns?id=eq.${campaignId}`, {
    method: "PATCH",
    body: { status: "sent", sent_at: now },
  });

  return Response.json({
    ok: true,
    data: {
      campaignId: campaign.id,
      provider,
      queued,
      note: `Provider adapter "${provider}" is not implemented yet; delivery events are queued but not sent.`,
    },
  });
});
