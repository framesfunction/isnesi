import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminAuditEvent = {
  id: number;
  action: string;
  actorId: string | null;
  tableName: string;
  recordId: string | null;
  oldData: unknown;
  newData: unknown;
  metadata: unknown;
  createdAt: string;
};

export type AdminAuditFilters = {
  action?: string;
  actor?: string;
  table?: string;
  from?: string;
  to?: string;
};

export async function listAdminAuditEvents(
  filters: AdminAuditFilters,
): Promise<AdminAuditEvent[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  let query = supabase
    .from("audit_events")
    .select("id, action, actor_id, table_name, record_id, old_data, new_data, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.actor) query = query.eq("actor_id", filters.actor);
  if (filters.table) query = query.eq("table_name", filters.table);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin audit unavailable", { code: error.code });
    return null;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    actorId: row.actor_id,
    tableName: row.table_name,
    recordId: row.record_id,
    oldData: row.old_data,
    newData: row.new_data,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

export async function listAdminAuditActions() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("action")
    .order("action", { ascending: true });
  if (error) return null;
  const actions = [...new Set((data ?? []).map((row) => row.action))];
  return actions;
}

export async function listAdminAuditTables() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("table_name")
    .order("table_name", { ascending: true });
  if (error) return null;
  const tables = [...new Set((data ?? []).map((row) => row.table_name))];
  return tables;
}
