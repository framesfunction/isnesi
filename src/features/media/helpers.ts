/**
 * Pure support code for the Media library module.
 *
 * Nothing here touches the network, so it is trivially unit-testable and is the
 * single place storage paths and public URLs are constructed. Object paths are
 * always derived from a stored file name plus a caller-supplied unique id, so a
 * crafted file name can never escape its folder or collide with another asset.
 */

export const MEDIA_PUBLIC_BUCKET = "public-media";
export const MEDIA_PRIVATE_BUCKET = "private-documents";

/** The documented mime types a bucket may hold (mirrors the Storage policies). */
export const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

/** Lowercase, dash-separated, path-safe file name. Never empty, never a path. */
export function safeFileName(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 100);
  return cleaned.length > 0 ? cleaned : "asset";
}

function stemOf(safeName: string): string {
  const dot = safeName.lastIndexOf(".");
  const stem = dot > 0 ? safeName.slice(0, dot) : safeName;
  return stem.length > 0 ? stem : "asset";
}

/** Extension for the stored object: prefer the trusted mime type, else the name. */
export function extensionFor(mimeType: string, fileName: string): string {
  const fromMime = MIME_EXTENSIONS[mimeType];
  if (fromMime) return fromMime;
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return match ? match[1].toLowerCase() : "bin";
}

/**
 * Deterministic storage path `<folder>/<stem>-<uniqueId>.<ext>`.
 *
 * `uniqueId` is supplied by the caller (`crypto.randomUUID()`) so two uploads
 * that share a file name can never overwrite each other.
 */
export function buildObjectPath(fileName: string, mimeType: string, uniqueId: string): string {
  const stem = stemOf(safeFileName(fileName));
  const ext = extensionFor(mimeType, fileName);
  return `media/${stem}-${uniqueId}.${ext}`;
}

/** Public CDN-style URL for an object in a public bucket. */
export function publicObjectUrl(supabaseUrl: string, bucketId: string, objectPath: string): string {
  const base = supabaseUrl.replace(/\/+$/, "");
  const path = objectPath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${bucketId}/${path}`;
}

/** True when an asset can be rendered as an image preview. */
export function isImageMime(mimeType: string | null | undefined): boolean {
  return typeof mimeType === "string" && mimeType.startsWith("image/");
}

/** Human-readable file size for list and detail screens. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
