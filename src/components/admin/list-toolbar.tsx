import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type ListFilter =
  | {
      type: "search";
      name: string;
      label: string;
      placeholder?: string;
      value: string;
    }
  | {
      type: "select";
      name: string;
      label: string;
      value: string;
      options: { value: string; label: string }[];
    };

/**
 * List filters as a plain GET form.
 *
 * The URL is the state: submitting navigates to `?q=...&status=...`, the server
 * re-reads the data and the page stays shareable, bookmarkable and usable
 * without JavaScript. `hidden` carries the current sort so applying a filter
 * never silently reorders the list; `page` is intentionally omitted so a new
 * filter starts again at page one.
 */
export function ListToolbar({
  action,
  filters,
  hidden = {},
  submitLabel = "Apply",
}: {
  action: string;
  filters: ListFilter[];
  hidden?: Record<string, string>;
  submitLabel?: string;
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-end gap-3">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {filters.map((filter) => (
        <label
          key={filter.name}
          className="flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted"
        >
          <span>{filter.label}</span>
          {filter.type === "search" ? (
            <Input
              type="search"
              name={filter.name}
              defaultValue={filter.value}
              placeholder={filter.placeholder}
              className="min-h-10 w-64 max-w-full"
            />
          ) : (
            <Select name={filter.name} defaultValue={filter.value} className="min-h-10 w-48">
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </label>
      ))}

      <Button type="submit" variant="secondary" size="sm">
        {submitLabel}
      </Button>
    </form>
  );
}
