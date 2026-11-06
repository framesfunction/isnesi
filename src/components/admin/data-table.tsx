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
}: {
  columns: DataTableColumn[];
  caption?: string;
  isEmpty: boolean;
  empty?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Table>
      {caption ? <TableCaption>{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
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
            <TableCell colSpan={columns.length} className="py-6">
              {empty ?? <EmptyState title="Nothing to show yet." />}
            </TableCell>
          </TableRow>
        ) : (
          children
        )}
      </TableBody>
    </Table>
  );
}
