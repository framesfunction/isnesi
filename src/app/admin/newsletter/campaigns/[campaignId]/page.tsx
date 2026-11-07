import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/action-button";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { WhatsAppCopyButton } from "@/components/admin/whatsapp-copy-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminCampaign } from "@/features/newsletter/admin-queries";
import { deleteCampaignAction, setCampaignChannelAction } from "@/features/newsletter/actions";
import { buildWhatsAppMessage, splitWhatsAppMessage } from "@/features/newsletter/whatsapp";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Campaign" };
export const dynamic = "force-dynamic";

export default async function AdminNewsletterCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
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

  const { campaignId } = await params;
  const campaign = await getAdminCampaign(campaignId);
  if (!campaign) notFound();

  async function handleSetChannel(formData: FormData): Promise<void> {
    "use server";
    await setCampaignChannelAction(undefined, formData);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        eyebrow="Newsletter"
        title={campaign.name}
        description={campaign.subject}
        actions={<StatusBadge status={campaign.status} />}
      />

      <p className="mb-6 text-xs text-ink-muted">
        <Link href="/admin/newsletter" className="font-bold text-brand hover:underline">
          ← Back to newsletter
        </Link>
      </p>

      <Card className="mb-6 border border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSetChannel} className="flex items-center gap-3">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <select
              name="channel"
              defaultValue={campaign.channel}
              className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink"
            >
              <option value="email">Email (provider pending)</option>
              <option value="whatsapp">WhatsApp (manual sending)</option>
            </select>
            <button
              type="submit"
              disabled={campaign.status !== "draft"}
              className="min-h-10 rounded-xl bg-brand px-4 text-sm font-black text-white disabled:opacity-40"
            >
              Save channel
            </button>
          </form>
          {campaign.status !== "draft" ? (
            <p className="mt-2 text-xs text-ink-muted">
              Only draft campaigns can change channel.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <WhatsAppCard name={campaign.name} subject={campaign.subject} body={campaign.body} />

      <Card className="mb-6 border border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-ink-muted">
          <p>
            <span className="font-bold text-ink">Created:</span> {formatDateTime(campaign.createdAt)}
          </p>
          <p>
            <span className="font-bold text-ink">Scheduled:</span>{" "}
            {formatDateTime(campaign.scheduledAt)}
          </p>
          <p>
            <span className="font-bold text-ink">Approved:</span>{" "}
            {formatDateTime(campaign.approvedAt)}
          </p>
          <p>
            <span className="font-bold text-ink">Sent:</span> {formatDateTime(campaign.sentAt)}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Delivery events ({campaign.events.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaign.events.length === 0 ? (
            <EmptyState
              title="No delivery events yet."
              description="Delivery, opens and bounces appear here once the email provider reports them."
            />
          ) : (
            <ul className="divide-y divide-line">
              {campaign.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-bold text-ink">{event.eventType}</span>
                  <span className="text-xs text-ink-muted">
                    {formatDateTime(event.occurredAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border border-coral/40">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Delete campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Only draft or cancelled campaigns can be deleted. Deleting is
            permanent.
          </p>
          <div className="mt-3">
            <ActionButton
              action={deleteCampaignAction}
              hidden={{ campaignId: campaign.id }}
              label="Delete campaign"
              variant="danger"
              disabled={!["draft", "cancelled"].includes(campaign.status)}
              confirm={`Delete "${campaign.name}" permanently? This cannot be undone.`}
            />
          </div>
          {!["draft", "cancelled"].includes(campaign.status) ? (
            <p className="mt-2 text-xs text-ink-muted">
              Cancel the campaign before deleting it.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function WhatsAppCard({
  name,
  subject,
  body,
}: {
  name: string;
  subject: string;
  body: unknown;
}) {
  const message = buildWhatsAppMessage({ name, subject, body });
  const parts = splitWhatsAppMessage(message);

  return (
    <Card className="mb-6 border border-leaf/40">
      <CardHeader>
        <CardTitle className="font-display text-base font-extrabold text-brand">
          WhatsApp delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message ? (
          <>
            <p className="text-sm text-ink-muted">
              Paste each part, in order, into your WhatsApp Broadcast list, Status or groups.
              WhatsApp sending is manual until a Business API provider is connected; every send
              should go to contacts who have opted in.
            </p>
            <div className="mt-4 grid gap-3">
              {parts.map((part, index) => (
                <div key={index} className="rounded-xl border border-line bg-cream p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wider text-ink-muted">
                      Part {index + 1} of {parts.length} · {part.length} chars
                    </p>
                    <WhatsAppCopyButton text={part} label={`Copy part ${index + 1}`} />
                  </div>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm text-ink">
                    {part}
                  </pre>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Nothing to render yet."
            description="This campaign has no body blocks, so there is no WhatsApp text to send."
          />
        )}
      </CardContent>
    </Card>
  );
}
