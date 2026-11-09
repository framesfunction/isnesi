"use client";

import { useState } from "react";
import { Image, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media-picker";
import type { PickerMediaAsset } from "@/features/media/actions";

export interface FeaturedImagePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function FeaturedImagePicker({
  value,
  onChange,
}: FeaturedImagePickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSelect = (asset: PickerMediaAsset) => {
    onChange(asset.id);
    setPickerOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
        Featured image
      </label>
      <div className="relative group">
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-muted border border-line">
          {value ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
              {/* eslint-disable-next-line jsx-a11y/alt-text -- decorative lucide icon */}
              <Image className="mr-1.5 size-5" aria-hidden="true" />
              Image selected
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Choose image from media library
            </div>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs outline outline-outline bg-brand text-white rounded px-2 py-1 hover:bg-brand-strong"
          >
            {value ? "Change image" : "Choose image"}
          </button>
        </div>
        <input
          type="hidden"
          name="featuredImageId"
          value={value ?? ""}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPickerOpen(true)}
          className="flex-1 text-xs"
        >
          {value ? "Change image" : "Choose image from library"}
        </Button>
        {value && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-xs text-coral-strong hover:bg-coral/10"
          >
            <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
}
