import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_PUBLIC_BUCKET, publicObjectUrl } from "@/features/media/helpers";

/**
 * Admin reads for the Media library.
 *
 * Row Level Security decides visibility: only an actor holding `media.manage`
 * can read rows here, and the storage policies independently gate uploads and
 * deletes. These functions add no authorisation of their own.
 */

export type MediaRightsStatus =
  | "pending"
  | "owned"
  | "licensed"
  | "permission_recorded"
  | "restricted"
  | "expired";

export const MEDIA_RIGHTS_STATUSES: readonly MediaRightsStatus[] = [
  "pending",
  "owned",
  "licensed",
  "permission_recorded",
  "restricted",
  "expired",
];

export function isMediaRightsStatus(value: string): value is MediaRightsStatus {
  return (MEDIA_RIGHTS_STATUSES as readonly string[]).includes(value);
}

export type AdminMediaUsage = {
  entityType: string;
  entityId: string;
  usageRole: string;
};

export type AdminMediaAsset = {
  id: string;
  bucketId: string;
  objectPath: string;
  fileName: string;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  credit: string | null;
  rightsStatus: string;
  rightsReference: string | null;
  consentReference: string | null;
  safeguardingReviewed: boolean;
  createdAt: string;
  uploadedBy: string | null;
  /** Public URL for objects in the public bucket; null for private objects. */
  publicUrl: string | null;
  usageCount: number;
};

export type AdminMediaDetail = AdminMediaAsset & {
  usage: AdminMediaUsage[];
};

type MediaRow = {
  id: string;
  bucket_id: string;
  object_path: string;
  file_name: string;
  mime_type: string | null;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  credit: string | null;
  rights_status: string;
  rights_reference: string | null;
  consent_reference: string | null;
  safeguarding_reviewed: boolean;
  created_at: string;
  uploaded_by: string | null;
};

const MEDIA_COLUMNS =
  "id, bucket_id, object_path, file_name, mime_type, byte_size, width, height, alt_text, caption, credit, rights_status, rights_reference, consent_reference, safeguarding_reviewed, created_at, uploaded_by";

function toAsset(row: MediaRow, usageCount: number): AdminMediaAsset {
  return {
    id: row.id,
    bucketId: row.bucket_id,
    objectPath: row.object_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    caption: row.caption,
    credit: row.credit,
    rightsStatus: row.rights_status,
    rightsReference: row.rights_reference,
    consentReference: row.consent_reference,
    safeguardingReviewed: row.safeguarding_reviewed,
    createdAt: row.created_at,
    uploadedBy: row.uploaded_by,
    publicUrl:
      row.bucket_id === MEDIA_PUBLIC_BUCKET
        ? publicObjectUrl(getPublicEnv().supabaseUrl, row.bucket_id, row.object_path)
        : null,
    usageCount,
  };
}

/** Strip characters that would break a PostgREST `or` filter expression. */
function sanitiseSearch(value: string): string {
  return value.replace(/[(),*%]/g, " ").trim().slice(0, 120);
}

/**
 * Media assets for the admin list, newest first.
 *
 * Returns `null` when Supabase is not configured so the page can render an
 * honest "database not connected" state instead of an empty library.
 */
export async function listAdminMedia(options: {
  search?: string;
  rightsStatus?: string;
} = {}): Promise<AdminMediaAsset[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  let query = supabase
    .from("media_assets")
    .select(MEDIA_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

  const search = sanitiseSearch(options.search ?? "");
  if (search.length > 0) {
    query = query.or(`file_name.ilike.%${search}%,alt_text.ilike.%${search}%`);
  }

  const rights = options.rightsStatus ?? "";
  if (rights.length > 0 && isMediaRightsStatus(rights)) {
    query = query.eq("rights_status", rights);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("[isnesi] admin media unavailable", { code: error.code });
    return null;
  }

  const rows = (data ?? []) as MediaRow[];
  if (rows.length === 0) return [];

  const { data: usageRows, error: usageError } = await supabase
    .from("media_usage")
    .select("media_id")
    .in(
      "media_id",
      rows.map((row) => row.id),
    );

  if (usageError) {
    console.warn("[isnesi] media usage unavailable", { code: usageError.code });
  }

  const counts = new Map<string, number>();
  for (const usage of usageRows ?? []) {
    counts.set(usage.media_id, (counts.get(usage.media_id) ?? 0) + 1);
  }

  return rows.map((row) => toAsset(row, counts.get(row.id) ?? 0));
}

/** One asset with the records that reference it, or null when unavailable. */
export async function getAdminMediaAsset(mediaId: string): Promise<AdminMediaDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("media_assets")
    .select(MEDIA_COLUMNS)
    .eq("id", mediaId)
    .maybeSingle();

  if (error) {
    console.warn("[isnesi] admin media asset unavailable", { mediaId, code: error.code });
    return null;
  }
  if (!data) return null;

  const { data: usageRows } = await supabase
    .from("media_usage")
    .select("entity_type, entity_id, usage_role")
    .eq("media_id", mediaId);

  const usage: AdminMediaUsage[] = (usageRows ?? []).map((row) => ({
    entityType: row.entity_type,
    entityId: row.entity_id,
    usageRole: row.usage_role,
  }));

  return { ...toAsset(data as MediaRow, usage.length), usage };
}