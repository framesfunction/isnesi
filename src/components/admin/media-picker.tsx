"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listMediaForPickerAction, type PickerMediaAsset } from "@/features/media/actions";
import { formatBytes } from "@/features/media/helpers";

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: PickerMediaAsset) => void;
};

/**
 * Modal that lets an editor pick a rights-cleared image from the media library.
 * No JSON, no file paths — just a gallery of assets with a preview.
 */
export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [assets, setAssets] = useState<PickerMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMediaForPickerAction();
      if (result.status === "error") {
        setError(result.message ?? "Could not load the media library.");
        return;
      }
      setAssets(result.data?.assets ?? []);
    } catch {
      setError("Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load();
  }, [open, load]);

  const filtered = assets.filter(
    (asset) =>
      search.length === 0 ||
      asset.fileName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Choose an image from the media library"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col">
            <Card className="bg-white border border-line shadow-2xl">
              <CardHeader className="flex items-center justify-between p-4">
                <CardTitle className="text-lg font-extrabold text-brand">Choose an image</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search media by file name…"
                    className="w-full"
                  />
                </div>
                {error ? (
                  <p className="mb-4 text-sm font-bold text-coral">{error}</p>
                ) : null}
                {loading ? (
                  <p className="text-sm text-ink-muted">Loading media library…</p>
                ) : filtered.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    No images match your search. Upload assets in the Media library first.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.map((asset) => (
                      <MediaAssetCard
                        key={asset.id}
                        asset={asset}
                        onSelect={() => {
                          onSelect(asset);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MediaAssetCard({ asset, onSelect }: { asset: PickerMediaAsset; onSelect: () => void }) {
  return (
    <Card className="border border-line cursor-pointer hover:border-brand transition-colors" onClick={onSelect}>
      <CardContent className="p-3">
        <div className="relative h-32 overflow-hidden rounded-xl bg-muted mb-2">
          {asset.publicUrl ? (
            <NextImage
              src={asset.publicUrl}
              alt={asset.altText ?? asset.fileName}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
              {asset.mimeType?.split("/").pop() ?? "file"}
            </div>
          )}
        </div>
        <p className="truncate text-sm font-semibold text-ink" title={asset.fileName}>
          {asset.fileName}
        </p>
        <p className="text-xs text-ink-muted">
          {formatBytes(asset.byteSize)}{
            asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""
          }
        </p>
      </CardContent>
    </Card>
  );
}
