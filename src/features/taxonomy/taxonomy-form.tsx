import { ActionForm } from "@/components/admin/action-form";
import { saveCategoryAction, saveTagAction } from "@/features/taxonomy/actions";

/**
 * Shared create/edit form for a category or a tag.
 *
 * Both terms have the same shape in the schema (a stable `key` plus one English
 * label), so one form keeps the two screens identical.
 */

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

export type TaxonomyFormItem = { id: string; key: string; label: string | null };

export function TaxonomyForm({
  kind,
  item,
}: {
  kind: "category" | "tag";
  item?: TaxonomyFormItem;
}) {
  const isCategory = kind === "category";

  return (
    <ActionForm
      action={isCategory ? saveCategoryAction : saveTagAction}
      submitLabel={item ? "Save" : isCategory ? "Create category" : "Create tag"}
    >
      {item ? (
        <input type="hidden" name={isCategory ? "categoryId" : "tagId"} value={item.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={FIELD_LABELS}>
          <span>Key</span>
          <input
            type="text"
            name="key"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={item?.key ?? ""}
            placeholder={isCategory ? "e.g. in-the-classroom" : "e.g. inclusion"}
            className={INPUT_CLASS}
          />
        </label>
        <label className={FIELD_LABELS}>
          <span>English label</span>
          <input
            type="text"
            name="labelEn"
            required
            defaultValue={item?.label ?? ""}
            placeholder={isCategory ? "e.g. In the classroom" : "e.g. Inclusion"}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        The label is what visitors see on a story. The key stays stable, so it can be renamed without
        breaking anything.
      </p>
    </ActionForm>
  );
}
