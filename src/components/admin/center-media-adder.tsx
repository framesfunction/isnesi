"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { MediaPicker } from "@/components/admin/media-picker";
import { addCenterMediaAction } from "@/features/centers/actions";

/**
 * Client component that lets an admin add media from the library to a center.
 * Wraps the MediaPicker and submits the add-center-media server action on
 * selection, so the gallery updates immediately.
 */
export function CenterMediaAdder({
  centerId,
  onAdded,
}: {
  centerId: string;
  onAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isCover, setIsCover] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const handleSelect = (asset: {
    id: string;
    fileName: string | null;
    mimeType: string | null;
  }) => {
    setSelectedAssetId(asset.id);
    setMediaType(asset.mimeType?.startsWith("video/") ? "video" : "image");
    setCaption(asset.fileName ?? "");
    setOpen(false);
  };

  async function handleAdd(formData: FormData) {
    if (!selectedAssetId) return;

    formData.append("centerId", centerId);
    formData.append("mediaAssetId", selectedAssetId);
    formData.append("caption", caption);
    formData.append("sortOrder", sortOrder);
    formData.append("mediaType", mediaType);
    formData.append("isCover", isCover ? "on" : "off");

    // Call the server action directly
    await addCenterMediaAction(undefined as any, formData);

    setSelectedAssetId(null);
    setCaption("");
    setSortOrder("0");
    setIsCover(false);
    onAdded?.();
  }

  return (
    <div className="space-y-3">
      <form action={handleAdd} className="flex flex-wrap items-center gap-3">
        {selectedAssetId ? (
          <>
            <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
              <span>Asset</span>
              <span className="text-sm text-ink">{selectedAssetId}</span>
            </label>
            <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
              <span>Caption</span>
              <input
                type="text"
                name="caption"
                defaultValue={caption}
                className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink w-48"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
              <span>Media type</span>
              <select
                name="mediaType"
                defaultValue={mediaType}
                className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink w-40"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
              <span>Sort order</span>
              <input
                type="number"
                name="sortOrder"
                defaultValue={sortOrder}
                className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink w-24"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
              <input
                type="checkbox"
                name="isCover"
                defaultChecked={isCover}
                onChange={() => setIsCover((v) => !v)}
                className="rounded border-line bg-white"
              />
              <span>Set as cover image</span>
            </label>
            <button
              type="submit"
              disabled={!selectedAssetId}
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand bg-brand px-4 py-2 text-xs font-bold text-cream hover:bg-brand-strong transition-colors disabled:opacity-60"
            >
              <Plus className="size-4" /> Add to gallery
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAssetId(null);
                setCaption("");
                setIsCover(false);
              }}
              className="text-xs font-bold text-ink-muted hover:text-brand underline"
            >
              Clear
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-line bg-white px-4 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand transition-colors"
          >
            <Plus className="size-4" /> Select media from library
          </button>
        )}
      </form>

      {open && (
        <MediaPicker
          open={open}
          onClose={() => setOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}
