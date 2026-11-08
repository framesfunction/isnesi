"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { DataTable } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import {
  StatusBadge,
  CONTENT_STATUS_LABELS,
} from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_TYPES } from "@/lib/validation/cms";
import { formatDateTime } from "@/lib/format";
import type { AdminContentListItem } from "@/features/editorial/admin-queries";

const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";

const JSON_PLACEHOLDER =
  '[{ "type": "paragraph", "text": "Opening paragraph" }]';

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";

function Row({
  item,
  hrefBase,
  selected,
  onToggle,
}: {
  item: AdminContentListItem;
  hrefBase: string;
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  const isSelected = selected.includes(item.id);
  return (
    <tr className="border-t border-line/70">
      {" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggle(item.id, e.target.checked)}
          className="size-4 rounded border border-line text-brand"
        />
      </td>
      {" "}
      <td className="px-3 py-3 align-top min-w-0">
        {" "}
        <p className="font-bold text-ink truncate">{item.title ?? "(untitled)"}</p>{" "}
        <p className="font-mono text-xs text-ink-muted truncate">
          /stories/{item.slug}
        </p>{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {item.contentType}
      </td>{" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <StatusBadge status={item.status} />{" "}
      </td>
      {" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {formatDateTime(item.updatedAt)}
      </td>
      {" "}
      <td className="px-3 py-3 text-right align-top">
        {" "}
        <Link
          href={`${hrefBase}/${item.id}`}
          className="font-bold text-brand hover:underline"
        >
          {" "}
          Edit{" "}
        </Link>
      </td>
    </tr>
  );
}

export function StoriesListClient({
  items,
  search,
  type,
  status,
}: {
  items: AdminContentListItem[] | null;
  search: string;
  type: string;
  status: string;
}) {
  const itemsList = items ?? [];
  const [selected, setSelected] = useState<string[]>([]);
  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        {" "}
        <ListToolbar
          action="/admin/stories"
          filters={[
            { type: "search", name: "q", label: "Search title", value: search },
            {
              type: "select",
              name: "type",
              label: "Type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...CONTENT_TYPES.map((value) => ({ value, label: value })),
              ],
            },
            {
              type: "select",
              name: "status",
              label: "Workflow",
              value: status,
              options: [
                { value: "", label: "All statuses" },
                ...Object.entries(CONTENT_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label }),
                ),
              ],
            },
          ]}
          submitLabel="Apply"
        />{" "}
      </div>{" "}
      {items === null ? (
        <Card className="mb-6 border border-coral/40">
          {" "}
          <CardContent className="pt-5 text-sm text-ink-muted">
            {" "}
            The database is not connected, so the editorial list could not be
            loaded.{" "}
          </CardContent>{" "}
        </Card>
      ) : (
        <Fragment>
          <Card className="mb-8">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="font-display text-base font-extrabold text-brand">
              {" "}
              Content ({itemsList.length}){" "}
            </CardTitle>
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <DataTable
              columns={[
                { key: "title", label: "Title / slug" },
                { key: "type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "updated", label: "Updated" },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  srOnly: true,
                },
              ]}
              isEmpty={itemsList.length === 0}
              empty={
                <EmptyState
                  title="No content yet."
                  description="Create the first story, news item or announcement below."
                  whatWillBeHere="Stories, news articles, announcements and policy notices — each reviewed by an editor before publication."
                  whyItMatters="Stories are how you share what ISNESI does with the public. Every story is safeguarding-cleared before it goes live."
                  getStartedCta={{ label: "Create your first story", href: "/admin/stories" }}
                  helpText={{ label: "Read the Stories & news guide", href: "/admin/help" }}
                />
              }
              bulkActions={{
                label: "Selected content",
                items: [
                  {
                    label: "Publish selected",
                    onSelect: (ids) => {
                      setSelected([]);
                      console.log("Publish", ids);
                    },
                    disabled: selected.length === 0,
                  },
                  {
                    label: "Archive selected",
                    onSelect: (ids) => {
                      setSelected([]);
                      console.log("Archive", ids);
                    },
                    disabled: selected.length === 0,
                    variant: "danger",
                  },
                ],
                selected,
                totalItems: itemsList.length,
                onToggleAll: (checked) => {
                  setSelected(
                    checked ? itemsList.map((i) => i.id) : [],
                  );
                },
                onToggleItem: toggleSelect,
              }}
            >
              {" "}
              {itemsList.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  hrefBase="/admin/stories"
                  selected={selected}
                  onToggle={toggleSelect}
                />
              ))}{" "}
            </DataTable>{" "}
          </CardContent>{" "}
          </Card>
          <Card className="border border-line">
            {" "}
            <CardHeader>
              {" "}
              <CardTitle className="font-display text-base font-extrabold text-brand">
                {" "}
                New content{" "}
              </CardTitle>
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <form>
                {" "}
                <input type="hidden" name="contentId" value="" />{" "}
                <div className="grid gap-4 sm:grid-cols-3">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Slug</span>{" "}
                    <input
                      type="text"
                      name="slug"
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      className={INPUT_CLASS}
                    />{" "}
                  </label>
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Type</span>{" "}
                    <select
                      name="contentType"
                      defaultValue="story"
                      className={INPUT_CLASS}
                    >
                      {" "}
                      {CONTENT_TYPES.map((value) => (
                        <option key={value} value={value}>
                          {" "}
                          {value}{" "}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Featured</span>{" "}
                    <input
                      type="checkbox"
                      name="featured"
                      className="size-5 rounded border border-line"
                    />{" "}
                  </label>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>English title</span>{" "}
                    <input
                      type="text"
                      name="titleEn"
                      required
                      className={INPUT_CLASS}
                    />{" "}
                  </label>
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Scheduled date (optional)</span>{" "}
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      className={INPUT_CLASS}
                    />{" "}
                  </label>
                </div>
                <div className="mt-4">
                  {" "}
                  <label className={FIELD_LABELS}>
                    {" "}
                    <span>Body (JSON blocks)</span>{" "}
                    <textarea
                      name="bodyEnBlocks"
                      rows={8}
                      defaultValue={JSON_PLACEHOLDER}
                      spellCheck={false}
                      className="rounded-xl border border-line bg-white px-3 py-2 font-mono text-xs text-ink"
                    />{" "}
                  </label>
                </div>
                <p className="mt-3 text-xs text-ink-muted">
                  {" "}
                  Saving starts a new draft. Submit it for review from the editor
                  once it is ready; publishing and archiving need the
                  content.publish permission.{" "}
                </p>
              </form>
            </CardContent>{" "}
          </Card>
        </Fragment>
      )}
    </div>
  );
}
