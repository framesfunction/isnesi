import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Admin reads for the enquiries module. RLS enforces `enquiries.manage`;
 * child safeguarding referrals live in a separate restricted system and are
 * never visible here (spec 2.8).
 */

export type AdminEnquiryListItem = {
  id: string;
  referenceCode: string;
  enquiryType: string;
  fullName: string;
  email: string | null;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type AdminEnquiryNote = {
  id: string;
  note: string;
  authorId: string | null;
  createdAt: string;
};

export type AdminEnquiryAssignment = {
  id: string;
  assignedFrom: string | null;
  assignedTo: string;
  reason: string | null;
  assignedAt: string;
};

export type AdminEnquiryMessage = {
  id: string;
  direction: string;
  channel: string;
  body: string | null;
  deliveryStatus: string;
  sentBy: string | null;
  sentAt: string;
};

export type AdminEnquiryDetail = AdminEnquiryListItem & {
  phone: string | null;
  message: string;
  source: string;
  consentToContact: boolean;
  notes: AdminEnquiryNote[];
  assignments: AdminEnquiryAssignment[];
  messages: AdminEnquiryMessage[];
};

type EnquiryRow = {
  id: string;
  reference_code: string;
  enquiry_type: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: string;
  assigned_to: string | null;
  source: string;
  consent_to_contact: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

function toItem(row: EnquiryRow): AdminEnquiryListItem {
  return {
    id: row.id,
    referenceCode: row.reference_code,
    enquiryType: row.enquiry_type,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

export async function listAdminEnquiries(
  search: string,
  status: string,
  type: string,
): Promise<AdminEnquiryListItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("general_enquiries")
    .select(
      "id, reference_code, enquiry_type, full_name, email, status, assigned_to, created_at, updated_at, closed_at",
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,reference_code.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status as Database["public"]["Enums"]["enquiry_status"]);
  if (type) query = query.eq("enquiry_type", type);

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin enquiries unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => toItem(row as EnquiryRow));
}

export async function getAdminEnquiry(enquiryId: string): Promise<AdminEnquiryDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data: enquiry, error } = await supabase
    .from("general_enquiries")
    .select(
      "id, reference_code, enquiry_type, full_name, email, phone, message, status, assigned_to, source, consent_to_contact, created_at, updated_at, closed_at",
    )
    .eq("id", enquiryId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin enquiry unavailable", { enquiryId, code: error.code });
    return null;
  }
  if (!enquiry) return null;

  const { data: notes } = await supabase
    .from("enquiry_notes")
    .select("id, note, author_id, created_at")
    .eq("enquiry_id", enquiryId)
    .order("created_at", { ascending: true });

  const { data: assignments } = await supabase
    .from("enquiry_assignments")
    .select("id, assigned_from, assigned_to, reason, assigned_at")
    .eq("enquiry_id", enquiryId)
    .order("assigned_at", { ascending: true });

  const { data: messages } = await supabase
    .from("enquiry_messages")
    .select("id, direction, channel, body, delivery_status, sent_by, sent_at")
    .eq("enquiry_id", enquiryId)
    .order("sent_at", { ascending: true });

  return {
    ...toItem(enquiry as EnquiryRow),
    phone: enquiry.phone,
    message: enquiry.message,
    source: enquiry.source,
    consentToContact: enquiry.consent_to_contact,
    notes: (notes ?? []).map((note) => ({
      id: note.id,
      note: note.note,
      authorId: note.author_id,
      createdAt: note.created_at,
    })),
    assignments: (assignments ?? []).map((assignment) => ({
      id: assignment.id,
      assignedFrom: assignment.assigned_from,
      assignedTo: assignment.assigned_to,
      reason: assignment.reason,
      assignedAt: assignment.assigned_at,
    })),
    messages: (messages ?? []).map((message) => ({
      id: message.id,
      direction: message.direction,
      channel: message.channel,
      body: message.body,
      deliveryStatus: message.delivery_status,
      sentBy: message.sent_by,
      sentAt: message.sent_at,
    })),
  };
}

/** Active staff profiles for the assignment picker. */
export async function listAssignableStaff(): Promise<
  { id: string; displayName: string | null }[] | null
> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("is_active", true)
    .order("display_name", { ascending: true })
    .limit(100);

  if (error) {
    console.warn("[isnesi] staff list unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => ({ id: row.id, displayName: row.display_name }));
}
