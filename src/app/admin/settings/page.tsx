import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveSiteSettingAction } from "@/features/settings/actions";
import { listAdminSiteSettings } from "@/features/settings/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
export const metadata: Metadata = { title: "Site settings" };
export const dynamic = "force-dynamic";
const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
export default async function AdminSettingsPage() {
  const { allowed } = await requirePermission(
    "settings.manage",
    "/admin/settings",
  );
  if (!allowed) {
    return (
      <Card className="border border-line">
        {" "}
        <CardContent className="p-6 text-sm text-ink-muted">
          {" "}
          Your account does not have the{" "}
          <strong className="text-ink">settings.manage</strong> permission.{" "}
        </CardContent>{" "}
      </Card>
    );
  }
  const settings = await listAdminSiteSettings();
  if (settings === null) {
    return (
      <Card className="border border-coral/40">
        {" "}
        <CardContent className="p-6 text-sm text-ink-muted">
          {" "}
          The database is not connected, so site settings could not be loaded.
          Configure Supabase and reload.{" "}
        </CardContent>{" "}
      </Card>
    );
  }
  return (
    <div className="mx-auto max-w-4xl">
      {" "}
      <AdminPageHeader
        eyebrow="Administration"
        title="Site settings"
        description="Public-facing site configuration. Secrets and API keys are managed through deployment configuration."
      />{" "}
      <Card className="mb-8 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Add or update a setting{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <ActionForm action={saveSiteSettingAction} submitLabel="Save setting">
            {" "}
            <div className="grid gap-4 sm:grid-cols-3">
              {" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Key</span>{" "}
                <input
                  type="text"
                  name="key"
                  defaultValue=""
                  className={INPUT_CLASS}
                  placeholder="e.g. organisation.name"
                />{" "}
              </label>{" "}
              <label className={FIELD_LABELS}>
                {" "}
                <span>Value</span>{" "}
                <input
                  type="text"
                  name="value"
                  defaultValue=""
                  className={INPUT_CLASS}
                  placeholder="Setting value"
                />{" "}
              </label>{" "}
              <div className="flex items-end">
                {" "}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  {" "}
                  <input
                    type="checkbox"
                    name="isPublic"
                    defaultChecked
                    className="form-checkbox"
                  />{" "}
                  Public{" "}
                </label>{" "}
              </div>{" "}
            </div>{" "}
            <p className="mt-3 text-xs text-ink-muted">
              {" "}
              Public settings are readable by the public site; private settings
              are admin-only. Never store secrets or API keys here.{" "}
            </p>{" "}
          </ActionForm>{" "}
        </CardContent>{" "}
      </Card>{" "}
      <Card className="border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Current settings ({settings.length}){" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full text-sm">
              {" "}
              <thead>
                {" "}
                <tr className="text-left text-xs text-ink-muted">
                  {" "}
                  <th className="p-3 font-bold">Key</th>{" "}
                  <th className="p-3 font-bold">Value</th>{" "}
                  <th className="p-3 font-bold">Public</th>{" "}
                  <th className="p-3 font-bold">Updated</th>{" "}
                  <th className="p-3 font-bold">Updated by</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {settings.length === 0 ? (
                  <tr>
                    {" "}
                    <td colSpan={5} className="p-6 text-center text-ink-muted">
                      {" "}
                      No settings configured yet.{" "}
                    </td>{" "}
                  </tr>
                ) : (
                  settings.map((setting) => (
                    <tr key={setting.key} className="border-t border-line">
                      {" "}
                      <td className="p-3 font-mono text-sm">
                        {setting.key}
                      </td>{" "}
                      <td className="p-3 text-sm">
                        {" "}
                        {typeof setting.value === "string" ? (
                          <span className="font-mono">{setting.value}</span>
                        ) : (
                          <code className="text-xs text-ink-muted">
                            {JSON.stringify(setting.value)}
                          </code>
                        )}{" "}
                      </td>{" "}
                      <td className="p-3 text-sm">
                        {" "}
                        {setting.isPublic ? (
                          <span className="text-xs font-bold text-leaf-strong">
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">No</span>
                        )}{" "}
                      </td>{" "}
                      <td className="p-3 text-sm text-ink-muted">
                        {" "}
                        {new Date(setting.updatedAt).toLocaleDateString()}{" "}
                      </td>{" "}
                      <td className="p-3 text-sm text-ink-muted">
                        {" "}
                        {setting.updatedBy ?? "—"}{" "}
                      </td>{" "}
                    </tr>
                  ))
                )}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </CardContent>{" "}
      </Card>{" "}
      <div className="mt-6 flex gap-2">
        {" "}
        <Link href="/admin">
          {" "}
          <Button variant="outline">Back to dashboard</Button>{" "}
        </Link>{" "}
      </div>{" "}
    </div>
  );
}
