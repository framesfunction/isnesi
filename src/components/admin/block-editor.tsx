"use client";

import { useCallback, useState } from "react";
import NextImage from "next/image";
import { ArrowDown, ArrowUp, Image, Plus, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/admin/media-picker";
import { extractBlocks } from "@/lib/validation/blocks";
import type { PickerMediaAsset } from "@/features/media/actions";

/** Client-side mirror of the CMS block vocabulary. */
export type EditorBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "quote"; text: string }
  | { type: "callout"; text: string }
  | { type: "image"; mediaId: string; altText: string; caption: string; previewUrl?: string };

export type BlockType = EditorBlock["type"];

const BLOCK_TYPES: { key: BlockType; label: string; icon: React.ElementType }[] = [
  { key: "heading", label: "Heading", icon: Type },
  { key: "paragraph", label: "Paragraph", icon: Type },
  { key: "list", label: "List", icon: Type },
  { key: "quote", label: "Quote", icon: Type },
  { key: "callout", label: "Callout", icon: Type },
  { key: "image", label: "Image", icon: Image },
];

const INPUT_CLASS =
  "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink focus-visible:border-brand";
const TEXTAREA_CLASS =
  "rounded-xl border-2 border-line bg-white px-3 py-2 text-sm text-ink focus-visible:border-brand";

function emptyBlock(type: BlockType): EditorBlock {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "" };
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "list":
      return { type: "list", items: [""], ordered: false };
    case "quote":
      return { type: "quote", text: "" };
    case "callout":
      return { type: "callout", text: "" };
    case "image":
      return { type: "image", mediaId: "", altText: "", caption: "" };
  }
}

/** Convert a stored body (`{ blocks: [...] }` or a bare array) into editor blocks. */
export function parseEditorBlocks(body: unknown): EditorBlock[] {
  const blocks = extractBlocks(body);
  if (!Array.isArray(blocks)) return [];
  return blocks.map((raw) => {
    if (typeof raw !== "object" || raw === null) return emptyBlock("paragraph");
    const b = raw as Record<string, unknown>;
    const type = String(b.type ?? "paragraph");
    switch (type) {
      case "heading":
        return { type: "heading", level: b.level === 3 ? 3 : 2, text: String(b.text ?? "") };
      case "paragraph":
        return { type: "paragraph", text: String(b.text ?? "") };
      case "list":
        return {
          type: "list",
          items: Array.isArray(b.items)
            ? b.items.map((item) => String(item ?? "")).filter((text) => text.length > 0)
            : [""],
          ordered: b.ordered === true,
        };
      case "quote":
        return { type: "quote", text: String(b.text ?? "") };
      case "callout":
        return { type: "callout", text: String(b.text ?? "") };
      case "image":
        return {
          type: "image",
          mediaId: String(b.mediaId ?? ""),
          altText: String(b.altText ?? ""),
          caption: String(b.caption ?? ""),
        };
      default:
        return emptyBlock("paragraph");
    }
  });
}

/** Drop client-only fields before sending blocks to the server action. */
function toSerializable(block: EditorBlock) {
  const rest = { ...(block as Record<string, unknown>) };
  delete rest.previewUrl;
  return rest;
}

/** Serve the editor state to the server action as a single JSON field. */
export function BlockEditor({
  value,
  name = "bodyEnBlocks",
  required = true,
}: {
  value: EditorBlock[] | null | undefined;
  name?: string;
  required?: boolean;
}) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(value ?? []);
  const [editingImage, setEditingImage] = useState<number | null>(null);

  const json = JSON.stringify(blocks.map(toSerializable));

  const insertBlock = useCallback((type: BlockType) => {
    setBlocks((current) => [...current, emptyBlock(type)]);
  }, []);

  const removeBlock = useCallback((index: number) => {
    setBlocks((current) => current.filter((_, i) => i !== index));
  }, []);

  const moveBlock = useCallback((index: number, direction: -1 | 1) => {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const setField = useCallback((index: number, patch: Partial<EditorBlock>) => {
    setBlocks((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch } as EditorBlock;
      return next;
    });
  }, []);

  const setListItem = useCallback((index: number, itemIndex: number, value: string) => {
    setBlocks((current) => {
      const next = [...current];
      const block = next[index];
      if (block.type !== "list") return next;
      const items = [...block.items];
      items[itemIndex] = value;
      next[index] = { ...block, items };
      return next;
    });
  }, []);

  const addListItem = useCallback((index: number) => {
    setBlocks((current) => {
      const next = [...current];
      const block = next[index];
      if (block.type !== "list") return next;
      next[index] = { ...block, items: [...block.items, ""] };
      return next;
    });
  }, []);

  const removeListItem = useCallback((index: number, itemIndex: number) => {
    setBlocks((current) => {
      const next = [...current];
      const block = next[index];
      if (block.type !== "list") return next;
      const items = block.items.filter((_, i) => i !== itemIndex);
      next[index] = { ...block, items: items.length > 0 ? items : [""] };
      return next;
    });
  }, []);

  const pickImage = useCallback((index: number) => setEditingImage(index), []);
  const setImage = useCallback(
    (asset: PickerMediaAsset) => {
      if (editingImage === null) return;
      setBlocks((current) => {
        const block = current[editingImage];
        if (!block || block.type !== "image") return current;
        const next = [...current];
        next[editingImage] = {
          ...block,
          mediaId: asset.id,
          altText: block.altText.length > 0 ? block.altText : asset.fileName,
          previewUrl: asset.publicUrl ?? undefined,
        };
        return next;
      });
      setEditingImage(null);
    },
    [editingImage],
  );

  const valid =
    blocks.length > 0 &&
    blocks.every((block) => {
      if (block.type === "image")
        return block.mediaId.length > 0 && block.altText.length > 0;
      if (block.type === "list")
        return block.items.some((item) => item.trim().length > 0);
      return block.text.trim().length > 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-ink-muted">
          <Type aria-hidden="true" className="size-4" />
          Content blocks
        </div>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((blockType) => (
            <Button
              key={blockType.key}
              variant="outline"
              size="sm"
              onClick={() => insertBlock(blockType.key)}
              title={`Add ${blockType.label} block`}
            >
              <blockType.icon aria-hidden="true" className="mr-1.5 size-3.5" />
              {blockType.label}
            </Button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line bg-white/50 p-8 text-center text-ink-muted">
          <p className="text-sm">No blocks yet. Add a heading, paragraph, list or image to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {blocks.map((block, index) => (
            <BlockCard
              key={index}
              index={index}
              block={block}
              onRemove={() => removeBlock(index)}
              onMoveUp={() => moveBlock(index, -1)}
              onMoveDown={() => moveBlock(index, 1)}
              onSetField={(patch) => setField(index, patch)}
              onSetListItem={(itemIndex, value) => setListItem(index, itemIndex, value)}
              onAddListItem={() => addListItem(index)}
              onRemoveListItem={(itemIndex) => removeListItem(index, itemIndex)}
              onPickImage={() => pickImage(index)}
            />
          ))}
        </div>
      )}

      <MediaPicker
        open={editingImage !== null}
        onClose={() => setEditingImage(null)}
        onSelect={setImage}
      />

      {/* Hidden field carried to the Server Action; editors never see JSON. */}
      <input type="hidden" name={name} value={json} aria-label="Content blocks" />
      {!valid && required ? (
        <p className="mt-2 text-xs font-bold text-coral">
          Complete every block before saving (images need an asset and alt text).
        </p>
      ) : null}
    </div>
  );
}

interface BlockCardProps {
  index: number;
  block: EditorBlock;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetField: (patch: Partial<EditorBlock>) => void;
  onSetListItem: (itemIndex: number, value: string) => void;
  onAddListItem: () => void;
  onRemoveListItem: (itemIndex: number) => void;
  onPickImage: () => void;
}

function BlockCard({
  index,
  block,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSetField,
  onSetListItem,
  onAddListItem,
  onRemoveListItem,
  onPickImage,
}: BlockCardProps) {
  return (
    <Card className="border border-line rounded-2xl">
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">#{index + 1}</span>
          <Select
            value={block.type}
            onChange={(event) => onSetField({ type: event.target.value as BlockType })}
            className="min-w-[120px] text-xs border-none bg-transparent focus-visible:ring-0"
          >
            {BLOCK_TYPES.map((bt) => (
              <option key={bt.key} value={bt.key}>
                {bt.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          {index > 0 ? (
            <Button variant="ghost" size="icon" onClick={onMoveUp} title="Move up">
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          {index < 99 ? (
            <Button variant="ghost" size="icon" onClick={onMoveDown} title="Move down">
              <ArrowDown className="size-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          <Button variant="destructive" size="icon" onClick={onRemove} title="Remove block">
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {block.type === "image" ? (
          <ImageBlockEditor block={block} onSetField={onSetField} onPickImage={onPickImage} />
        ) : block.type === "list" ? (
          <ListBlockEditor
            block={block}
            onSetField={onSetField}
            onSetListItem={onSetListItem}
            onAddListItem={onAddListItem}
            onRemoveListItem={onRemoveListItem}
          />
        ) : (
          <TextBlockEditor block={block} onSetField={onSetField} />
        )}
      </CardContent>
    </Card>
  );
}

function TextBlockEditor({
  block,
  onSetField,
}: {
  block: Extract<EditorBlock, { type: "heading" | "paragraph" | "quote" | "callout" }>;
  onSetField: (patch: Partial<EditorBlock>) => void;
}) {
  const isHeading = block.type === "heading";
  return (
    <div className="space-y-3">
      {isHeading ? (
        <div className="flex items-center gap-3">
          <label className="text-xs font-black uppercase tracking-[0.1em] text-ink-muted">Level</label>
          <Select
            value={String(block.level)}
            onChange={(event) =>
              onSetField({ level: (Number(event.target.value) as 2 | 3) })
            }
            className="min-w-[60px] text-xs border-none bg-transparent focus-visible:ring-0"
          >
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </Select>
        </div>
      ) : null}
      <div className="relative">
        <Textarea
          value={block.text}
          onChange={(event) => onSetField({ text: event.target.value })}
          rows={isHeading ? 2 : 5}
          placeholder={isHeading ? "Write a heading…" : "Write your text…"}
          className={TEXTAREA_CLASS}
        />
      </div>
    </div>
  );
}

function ListBlockEditor({
  block,
  onSetField,
  onSetListItem,
  onAddListItem,
  onRemoveListItem,
}: {
  block: Extract<EditorBlock, { type: "list" }>;
  onSetField: (patch: Partial<EditorBlock>) => void;
  onSetListItem: (itemIndex: number, value: string) => void;
  onAddListItem: () => void;
  onRemoveListItem: (itemIndex: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-black uppercase tracking-[0.1em] text-ink-muted">Style</label>
        <Select
          value={block.ordered ? "ordered" : "bulleted"}
          onChange={(event) => onSetField({ ordered: event.target.value === "ordered" })}
          className="min-w-[120px] text-xs border-none bg-transparent focus-visible:ring-0"
        >
          <option value="bulleted">Bulleted list</option>
          <option value="ordered">Numbered list</option>
        </Select>
      </div>
      <ul className="grid gap-2">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-muted">{itemIndex + 1}</span>
            <Input
              value={item}
              onChange={(event) => onSetListItem(itemIndex, event.target.value)}
              placeholder="List item…"
              className="flex-1 min-h-9 text-sm border-none bg-transparent focus-visible:ring-0"
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onRemoveListItem(itemIndex)}
              aria-label="Remove item"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={onAddListItem}>
        <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
        Add item
      </Button>
    </div>
  );
}

function ImageBlockEditor({
  block,
  onSetField,
  onPickImage,
}: {
  block: Extract<EditorBlock, { type: "image" }>;
  onSetField: (patch: Partial<EditorBlock>) => void;
  onPickImage: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
          <span>Image</span>
          <Button variant="outline" size="sm" onClick={onPickImage}>
            {block.mediaId.length > 0 ? "Change image" : "Choose image from library"}
          </Button>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
          <span>Alt text (required)</span>
          <Input
            value={block.altText}
            onChange={(event) => onSetField({ altText: event.target.value })}
            placeholder="Describe the image for visitors who cannot see it"
            className={INPUT_CLASS}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
        <span>Caption (optional)</span>
        <Input
          value={block.caption ?? ""}
          onChange={(event) => onSetField({ caption: event.target.value })}
          placeholder="Caption shown beneath the image"
          className={INPUT_CLASS}
        />
      </label>
      {block.previewUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-line bg-white">
          <NextImage
            src={block.previewUrl}
            alt={block.altText}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ) : block.mediaId.length > 0 ? (
        <p className="text-xs text-ink-muted">Image selected. Preview appears after it is inserted from the library.</p>
      ) : null}
    </div>
  );
}
