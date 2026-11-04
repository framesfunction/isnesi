import { ActionForm } from "@/components/admin/action-form";
import { extractBlocks } from "@/lib/validation/blocks";
import { saveProgrammeAction } from "@/features/programmes/actions";
import type { AdminProgrammeDetail } from "@/features/programmes/admin-queries";

/**
 * Shared create/edit form for a programme.
 *
 * One component keeps the two screens identical, so a field added here appears
 * everywhere and the English/French pair can never drift apart.
 */

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

const TEXTAREA_CLASS =
  "rounded-xl border-2 border-line bg-white px-3 py-2 font-mono text-xs text-ink";

const BLOCKS_PLACEHOLDER = '[{ "type": "paragraph", "text": "Programme description" }]';

function blocksJson(body: unknown): string {
  const blocks = extractBlocks(body);
  return JSON.stringify(blocks ?? [], null, 2);
}

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
          English (required)
        </legend>
        <div className="grid gap-4">
          <label className={FIELD_LABELS}>
            <span>Title</span>
            <input
              type="text"
              name="titleEn"
              required
              defaultValue={programme?.en?.title ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Summary</span>
            <input
              type="text"
              name="summaryEn"
              defaultValue={programme?.en?.summary ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Body (JSON blocks)</span>
            <textarea
              name="bodyEnBlocks"
              rows={6}
              spellCheck={false}
              defaultValue={programme ? blocksJson(programme.en?.body) : BLOCKS_PLACEHOLDER}
              className={TEXTAREA_CLASS}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-4 rounded-2xl border-2 border-line p-4">
        <legend className="px-2 text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
          French (optional)
        </legend>
        <div className="grid gap-4">
          <label className={FIELD_LABELS}>
            <span>Title</span>
            <input
              type="text"
              name="titleFr"
              defaultValue={programme?.fr?.title ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Summary</span>
            <input
              type="text"
              name="summaryFr"
              defaultValue={programme?.fr?.summary ?? ""}
              className={INPUT_CLASS}
            />
          </label>
          <label className={FIELD_LABELS}>
            <span>Body (JSON blocks)</span>
            <textarea
              name="bodyFrBlocks"
              rows={4}
              spellCheck={false}
              defaultValue={programme?.fr ? blocksJson(programme.fr.body) : ""}
              className={TEXTAREA_CLASS}
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Leave the French title blank to keep English only. Block types: heading, paragraph, list,
          quote, callout.
        </p>
      </fieldset>
    </ActionForm>
  );
}