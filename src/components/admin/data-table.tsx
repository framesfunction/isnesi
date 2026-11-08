import type { ReactNode } from "react";

import { EmptyState } from "@/components/admin/empty-state";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** Hides the label visually while keeping it for screen readers. */
  srOnly?: boolean;
};

export type DataTableBulkAction = {
  label: string;
  onSelect: (selected: string[]) => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
};

const ALIGN: Record<"left" | "right" | "center", string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * Server-rendered admin table.
 *
 * Column definitions live with the screen that owns them; rows are passed as
 * children, so the table stays a plain server component and every list screen
 * renders identically. When `isEmpty` is true the caller's `empty` node (or a
 * default `EmptyState`) is shown in a spanning row instead of nothing.
 */
export function DataTable({
  columns,
  caption,
  isEmpty,
  empty,
  children,
  bulkActions,
}: {
  columns: DataTableColumn[];
  caption?: string;
  isEmpty?: boolean;
  empty?: ReactNode;
  children: ReactNode;
  bulkActions?: {
    label: string;
    items: DataTableBulkAction[];
    selected: string[];
    totalItems: number;
    onToggleAll: (checked: boolean) => void;
    onToggleItem: (id: string, checked: boolean) => void;
  };
}) {
  const hasSelection = (bulkActions?.selected.length ?? 0) > 0;
  const bulkColumns = bulkActions
    ? [
        {
          key: "select",
          label: <input
            type="checkbox"
            checked={bulkActions.selected.length === bulkActions.totalItems}
            onChange={(e) => bulkActions.onToggleAll(e.target.checked)}
            className="size-4 rounded border border-line text-brand"
            aria-label="Select all"
          />,
          align: "center" as const,
          srOnly: false,
        },
        ...columns,
      ]
    : columns;

  return (
    <div className="overflow-x-auto sm:overflow-visible">
      <Table>
      {caption ? <TableCaption>{caption}</TableCaption> : null}
      {bulkActions && hasSelection ? (
        <tfoot>
          <TableRow>
            <TableCell colSpan={bulkColumns.length} className="py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink">
                  {bulkActions.selected.length} selected
                </span>
                {bulkActions.items.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => action.onSelect(bulkActions.selected)}
                    disabled={action.disabled}
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                      action.variant === "danger"
                        ? "bg-coral text-white hover:bg-coral-strong"
                        : action.variant === "primary"
                        ? "bg-brand text-white hover:bg-brand-strong"
                    : "border-2 border-line bg-white text-ink hover:bg-brand-soft hover:text-brand"
                  ].join(" ")}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </TableCell>
          </TableRow>
        </tfoot>
      ) : null}
      <TableHeader>
        <TableRow>
          {bulkColumns.map((column) => (
            <TableHead
              key={column.key}
              scope="col"
              className={ALIGN[column.align ?? "left"]}
            >
              {column.srOnly ? (
                <span className="sr-only">{column.label}</span>
              ) : (
                column.label
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isEmpty ? (
          <TableRow>
            <TableCell colSpan={bulkColumns.length} className="py-6">
              {empty ?? <EmptyState title="Nothing to show yet." />}
            </TableCell>
          </TableRow>
        ) : (
          children
        )}
      </TableBody>
    </Table>
    </div>
  );
}
