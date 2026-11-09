import { ActionForm } from "@/components/admin/action-form";
import { BlockEditor } from "@/components/admin/block-editor";
import { FeaturedImagePicker } from "@/components/admin/featured-image-picker";
import { parseEditorBlocks } from "@/lib/validation/blocks";
import { linesToText } from "@/features/programmes/helpers";
import { saveProgrammeAction } from "@/features/programmes/actions";
import type { AdminProgrammeDetail } from "@/features/programmes/admin-queries";

/**
 * Shared create/edit form for a programme.
 *
 * One component keeps the two screens identical, so a field added here appears
 * everywhere.
 */

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

const PLAIN_TEXTAREA_CLASS = "rounded-xl border-2 border-line bg-white px-3 py-2 text-sm text-ink";

export function ProgrammeForm({ programme }: { programme?: AdminProgrammeDetail }) {
  return (
    <ActionForm
      action={saveProgrammeAction}
      submitLabel={programme ? "Save programme" : "Create programme"}
    >
      {programme ? <input type="hidden" name="programmeId" value={programme.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={FIELD_LABELS}>
          <span>Key</span>
          <input
            type="text"
            name="key"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={programme?.key ?? ""}
            placeholder="e.g. inclusive-education"
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>Icon (optional)</span>
          <input
            type="text"
            name="icon"
            defaultValue={programme?.icon ?? ""}
            placeholder="emoji or short label"
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>Sort order</span>
          <input
            type="number"
            name="sortOrder"
            defaultValue={programme?.sortOrder ?? 0}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className={`${FIELD_LABELS} mt-3 justify-start`}>
        <span>Active on the public site</span>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={programme ? programme.isActive : true}
          className="size-5 rounded border-2 border-line"
        />
      </label>

      <fieldset className="mt-5 rounded-2xl border-2 border-line p-4">
        <legend className="px-2 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
          Programme details
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <FeaturedImagePicker
            value={programme?.featuredImageId ?? null}
            onChange={() => {
              // Handled by hidden input; form submission includes the value.
            }}
          />
          <label className={FIELD_LABELS}>
            <span>Target beneficiaries</span>
            <input
              type="text"
              name="targetBeneficiaries"
              defaultValue={programme?.targetBeneficiaries ?? ""}
              placeholder="e.g. children aged 6-12"
              className={INPUT_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Geographic coverage</span>
            <input
              type="text"
              name="geographicCoverage"
              defaultValue={programme?.geographicCoverage ?? ""}
              placeholder="e.g. Centre region"
              className={INPUT_CLASS}
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={FIELD_LABELS}>
            <span>Objectives (one per line)</span>
            <textarea
              name="objectives"
              rows={4}
              defaultValue={linesToText(programme?.objectives)}
              className={PLAIN_TEXTAREA_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Activities (one per line)</span>
            <textarea
              name="activities"
              rows={4}
              defaultValue={linesToText(programme?.activities)}
              className={PLAIN_TEXTAREA_CLASS}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border-2 border-line p-4">
        <legend className="px-2 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
          English (required)
        </legend>
        <div className="grid gap-4">
          <label className={FIELD_LABELS}>
            <span>Title</span>
            <input
              type="text"
              name="titleEn"
              required
              defaultValue={programme?.title ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Summary</span>
            <input
              type="text"
              name="summaryEn"
              defaultValue={programme?.summary ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={FIELD_LABELS}>
              <span>SEO title</span>
              <input
                type="text"
                name="seoTitleEn"
                defaultValue={programme?.seoTitle ?? ""}
                className={INPUT_CLASS}
              />
            </label>
            <label className={FIELD_LABELS}>
              <span>SEO description</span>
              <input
                type="text"
                name="seoDescriptionEn"
                defaultValue={programme?.seoDescription ?? ""}
                className={INPUT_CLASS}
              />
            </label>
          </div>
          <label className={FIELD_LABELS}>
            <span>Body (content blocks)</span>
            <BlockEditor
              name="bodyEnBlocks"
              value={programme ? parseEditorBlocks(programme.body) : []}
            />
            <p className="text-xs text-ink-muted">
              Blocks are heading, paragraph, list, quote, callout and image.
              Images are picked from the media library.
            </p>
          </label>
        </div>
      </fieldset>
    </ActionForm>
  );
}