import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function listAdminDonations() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("id, public_reference, donor_name, donor_email, amount_minor, currency, payment_status, provider_key, provider_transaction_id, receipt_number, paid_at, created_at, campaign_id")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return null;
  return data ?? [];
}

export async function listAdminDonationCampaigns() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donation_campaigns")
    .select(`
      id,
      key,
      is_active,
      starts_at,
      ends_at,
      created_at,
      donation_campaign_translations!inner(title, description, locale)
    `)
    .eq("donation_campaign_translations.locale", "en")
    .order("created_at", { ascending: false });
  if (error) return null;
  return data ?? [];
}

export async function listAdminRefunds() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donation_refunds")
    .select(`
      id,
      donation_id,
      amount_minor,
      reason,
      provider_refund_id,
      status,
      requested_by,
      approved_by,
      approved_at,
      created_at,
      donations!inner(public_reference, amount_minor, payment_status, donor_name)
    `)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return null;
  return data ?? [];
}

export async function listAdminReconciliations() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_reconciliations")
    .select("id,period_start,period_end,provider_key,statement_reference,total_minor,currency,status,notes,created_at,created_by")
    .order("period_start", { ascending: false })
    .limit(200);
  if (error) return null;
  return data ?? [];
}

export async function getAdminDonationStats() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const [totalResult, succeededResult, failedResult, pendingResult, refundedResult] =
    await Promise.all([
      supabase.from("donations").select("amount_minor", { count: "exact", head: true }),
      supabase.from("donations").select("amount_minor").eq("payment_status", "succeeded"),
      supabase.from("donations").select("amount_minor").eq("payment_status", "failed"),
      supabase.from("donations").select("amount_minor").in("payment_status", ["created", "pending"]),
      supabase.from("donations").select("amount_minor").in("payment_status", ["refunded", "partially_refunded"]),
    ]);

  const sum = (rows: { amount_minor: number }[] | null) =>
    (rows ?? []).reduce((acc, row) => acc + (row.amount_minor ?? 0), 0);

  return {
    totalCount: totalResult.count ?? 0,
    totalVolume: sum(totalResult.data ?? []),
    succeededCount: (succeededResult.data ?? []).length,
    succeededVolume: sum(succeededResult.data ?? []),
    failedCount: (failedResult.data ?? []).length,
    failedVolume: sum(failedResult.data ?? []),
    pendingCount: (pendingResult.data ?? []).length,
    pendingVolume: sum(pendingResult.data ?? []),
    refundedCount: (refundedResult.data ?? []).length,
    refundedVolume: sum(refundedResult.data ?? []),
  };
}

export async function getAdminDonationById(id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("*, donation_campaigns(key)")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data ?? null;
}
