import type { Metadata } from "next";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import {
  listAdminNavigation,
  type AdminNavigationMenu,
} from "@/features/navigation/admin-queries";
import {
  deleteNavigationItemAction,
  reorderNavigationItemAction,
  saveNavigationItemAction,
  setNavigationItemVisibilityAction,
} from "@/features/navigation/actions";
export const metadata: Metadata = { title: "Navigation" };
export const dynamic = "force-dynamic";
const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
function ItemRow({
  menu,
  item,
}: {
  menu: AdminNavigationMenu;
  item: AdminNavigationMenu["items"][number];
}) {
  return (
    <li className="rounded-xl border border-line bg-white p-4">
      {" "}
      <div className="flex flex-wrap items-center gap-3">
        {" "}
        <strong className="text-sm text-ink">{item.label}</strong>{" "}
        <span className="font-mono text-xs text-ink-muted">{item.href}</span>{" "}
        <Badge variant="neutral">#{item.sortOrder}</Badge>{" "}
        {item.isVisible ? (
          <Badge variant="success">Visible</Badge>
        ) : (
          <Badge variant="warning">Hidden</Badge>
        )}{" "}
        {item.openNewTab ? <Badge variant="outline">New tab</Badge> : null}{" "}
        {item.parentId ? <Badge variant="neutral">Nested</Badge> : null}{" "}
        {item.resolves ? null : (
          <Badge variant="danger">Link not found</Badge>
        )}{" "}
      </div>{" "}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {" "}
        <ActionButton
          action={reorderNavigationItemAction}
          hidden={{ itemId: item.id, direction: "up" }}
          label="Move up"
          variant="outline"
        />{" "}
        <ActionButton
          action={reorderNavigationItemAction}
          hidden={{ itemId: item.id, direction: "down" }}
          label="Move down"
          variant="outline"
        />{" "}
        <ActionButton
          action={setNavigationItemVisibilityAction}
          hidden={{ itemId: item.id, isVisible: !item.isVisible }}
          label={item.isVisible ? "Hide" : "Show"}
          variant="ghost"
        />{" "}
        <ActionButton
          action={deleteNavigationItemAction}
          hidden={{ itemId: item.id }}
          label="Delete"
          variant="danger"
          confirm={`Delete "${item.label}" and any nested children?`}
        />{" "}
      </div>{" "}
      <details className="mt-3">
        {" "}
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-brand">
          {" "}
          Edit item{" "}
        </summary>{" "}
        <div className="mt-3">
          {" "}
          <ActionForm action={saveNavigationItemAction} submitLabel="Save item">
            {" "}
            <input type="hidden" name="itemId" value={item.id} />{" "}
            <input type="hidden" name="menuId" value={menu.id} />{" "}
            <div className="grid gap-4 sm:grid-cols-2">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Label</span>{" "}
                <input
                  type="text"
                  name="label"
                  defaultValue={item.label}
                  required
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Link (href)</span>{" "}
                <input
                  type="text"
                  name="href"
                  defaultValue={item.href}
                  required
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
            </div>{" "}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Sort order</span>{" "}
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={item.sortOrder}
                  className={INPUT_CLASS}
                />{" "}
              </label>{" "}
              <label className={`${FIELD_LABELS} justify-start`}>
                {" "}
                <span>Visible</span>{" "}
                <input
                  type="checkbox"
                  name="isVisible"
                  defaultChecked={item.isVisible}
                  className="size-5 rounded border border-line"
                />{" "}
              </label>{" "}
              <label className={`${FIELD_LABELS} justify-start`}>
                {" "}
                <span>Open in new tab</span>{" "}
                <input
                  type="checkbox"
                  name="openNewTab"
                  defaultChecked={item.openNewTab}
                  className="size-5 rounded border border-line"
                />{" "}
              </label>{" "}
            </div>{" "}
          </ActionForm>{" "}
        </div>{" "}
      </details>{" "}
    </li>
  );
}
export default async function AdminNavigationPage() {
  const { allowed } = await requirePermission(
    "pages.manage",
    "/admin/navigation",
  );
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the pages.manage permission."
      />
    );
  }
  const menus = await listAdminNavigation();
  return (
    <div className="mx-auto max-w-5xl">
      {" "}
      <AdminPageHeader
        eyebrow="Website"
        title="Navigation"
        description="Header and footer menus: labels, links, ordering and visibility. Page slugs link as /slug; external links use a full URL."
      />{" "}
      {menus === null ? (
        <Card className="border border-coral/40">
          {" "}
          <CardContent className="pt-5 text-sm text-ink-muted">
            {" "}
            The database is not connected, so the menus could not be
            loaded.{" "}
          </CardContent>{" "}
        </Card>
      ) : (
        <div className="space-y-8">
          {" "}
          {menus.map((menu) => (
            <Card key={menu.id} className="border border-line">
              {" "}
              <CardHeader>
                {" "}
                <CardTitle className="font-display text-base font-extrabold text-brand">
                  {" "}
                  {menu.label}{" "}
                  <span className="font-mono text-xs text-ink-muted">
                    ({menu.key})
                  </span>{" "}
                </CardTitle>{" "}
              </CardHeader>{" "}
              <CardContent>
                {" "}
                {menu.items.length === 0 ? (
                  <EmptyState
                    title="No items in this menu yet."
                    description="Add the first link with the form below."
                  />
                ) : (
                  <ul className="space-y-3">
                    {" "}
                    {menu.items.map((item) => (
                      <ItemRow key={item.id} menu={menu} item={item} />
                    ))}{" "}
                  </ul>
                )}{" "}
                <details className="mt-5">
                  {" "}
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.1em] text-brand">
                    {" "}
                    Add an item to {menu.label}{" "}
                  </summary>{" "}
                  <div className="mt-3">
                    {" "}
                    <ActionForm
                      action={saveNavigationItemAction}
                      submitLabel="Add item"
                    >
                      {" "}
                      <input type="hidden" name="menuId" value={menu.id} />{" "}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {" "}
                        <label className={FIELD_LABELS}>
                          {" "}
                          <span>Label</span>{" "}
                          <input
                            type="text"
                            name="label"
                            required
                            className={INPUT_CLASS}
                          />{" "}
                        </label>{" "}
                        <label className={FIELD_LABELS}>
                          {" "}
                          <span>Link (href)</span>{" "}
                          <input
                            type="text"
                            name="href"
                            required
                            placeholder="/about or https://"
                            className={INPUT_CLASS}
                          />{" "}
                        </label>{" "}
                      </div>{" "}
                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        {" "}
                        <label className={FIELD_LABELS}>
                          {" "}
                          <span>Sort order</span>{" "}
                          <input
                            type="number"
                            name="sortOrder"
                            defaultValue={(menu.items.length + 1) * 10}
                            className={INPUT_CLASS}
                          />{" "}
                        </label>{" "}
                        <label className={`${FIELD_LABELS} justify-start`}>
                          {" "}
                          <span>Visible</span>{" "}
                          <input
                            type="checkbox"
                            name="isVisible"
                            defaultChecked
                            className="size-5 rounded border border-line"
                          />{" "}
                        </label>{" "}
                        <label className={`${FIELD_LABELS} justify-start`}>
                          {" "}
                          <span>Open in new tab</span>{" "}
                          <input
                            type="checkbox"
                            name="openNewTab"
                            className="size-5 rounded border border-line"
                          />{" "}
                        </label>{" "}
                      </div>{" "}
                      <div className="mt-4">
                        {" "}
                        <label className={FIELD_LABELS}>
                          {" "}
                          <span>Parent item (optional, same menu)</span>{" "}
                          <select
                            name="parentItemId"
                            defaultValue=""
                            className={INPUT_CLASS}
                          >
                            {" "}
                            <option value="">- none -</option>{" "}
                            {menu.items
                              .filter((item) => item.parentId === null)
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {" "}
                                  {item.label}{" "}
                                </option>
                              ))}{" "}
                          </select>{" "}
                        </label>{" "}
                      </div>{" "}
                    </ActionForm>{" "}
                  </div>{" "}
                </details>{" "}
              </CardContent>{" "}
            </Card>
          ))}{" "}
        </div>
      )}{" "}
    </div>
  );
}
