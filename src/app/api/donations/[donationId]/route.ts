import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ donationId: string }> },
) {
  const { donationId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donations")
    .select("id, public_reference, donor_name, donor_email, amount_minor, currency, payment_status, provider_key, provider_transaction_id, payer_phone, receipt_number, paid_at, created_at")
    .eq("id", donationId)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
