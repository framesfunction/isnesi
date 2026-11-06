import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSnapshot } from "@/features/dashboard/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { visibleAdminModules } from "@/lib/permissions/admin-nav";
import { formatDateTime } from "@/lib/format";
export const metadata: Metadata = { title: "Dashboard" };
export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const snapshot = await getDashboardSnapshot();
  const quickLinks = visibleAdminModules(user)
    .filter((module) => module.key !== "dashboard")
    .slice(0, 6);
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Overview"
        title={`Welcome, ${user.displayName ?? "colleague"}`}
        description="Operational indicators for the public website. Every figure is a count read through Row Level Security for your role."
        actions={
          <Badge variant={snapshot.unavailable ? "warning" : "success"}>
            {" "}
            {snapshot.unavailable ? "Database not connected" : "Live data"}{" "}
          </Badge>
        }
      />{" "}
      {snapshot.unavailable ? (
        <Card className="mb-5 border border-sun/70 bg-sun-soft">
          {" "}
          <CardContent className="text-sm text-ink">
            {" "}
            <strong className="font-black">No database connection.</strong> Set
            the Supabase environment variables and apply the migrations in{" "}
            <code>supabase/</code>. Until then the dashboard shows placeholders
            and no records are read.{" "}
          </CardContent>{" "}
        </Card>
      ) : null}{" "}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {" "}
        {snapshot.metrics.map((metric) => (
          <li key={metric.key}>
            {" "}
            <Link href={metric.href} className="block h-full">
              {" "}
              <Card className="h-full border border-line transition-colors hover:border-brand/50">
                {" "}
                <CardHeader>
                  {" "}
                  <CardTitle className="text-xs font-black uppercase tracking-[0.12em] text-ink-muted">
                    {" "}
                    {metric.label}{" "}
                  </CardTitle>{" "}
                </CardHeader>{" "}
                <CardContent>
                  {" "}
                  <p className="text-3xl font-black tabular-nums text-brand">
                    {" "}
                    {metric.value === null
                      ? "—"
                      : metric.value.toLocaleString()}{" "}
                  </p>{" "}
                  <p className="mt-1 text-xs text-ink-muted">
                    {metric.hint}
                  </p>{" "}
                </CardContent>{" "}
              </Card>{" "}
            </Link>{" "}
          </li>
        ))}{" "}
      </ul>{" "}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {" "}
        <Card className="border border-line lg:col-span-2">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="font-display text-base font-extrabold text-brand">
              {" "}
              Jump to a module{" "}
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <ul className="grid gap-2 sm:grid-cols-2">
              {" "}
              {quickLinks.map((module) => (
                <li key={module.key}>
                  {" "}
                  <Link
                    href={module.href}
                    className="block rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {" "}
                    {module.label}{" "}
                    <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                      {" "}
                      {module.description}{" "}
                    </span>{" "}
                  </Link>{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="border border-coral/40">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="font-display text-base font-extrabold text-brand">
              {" "}
              Safeguarding is separate{" "}
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent className="text-sm text-ink-muted">
            {" "}
            <p>
              {" "}
              Casework lives in a private schema that is not exposed through the
              API. Only safeguarding officers can reach it, through server-side
              functions that log every access.{" "}
            </p>{" "}
            <p className="mt-3">
              {" "}
              This dashboard never shows case detail — at most an aggregated,
              permission-gated indicator.{" "}
            </p>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
      <p className="mt-6 text-xs text-ink-muted">
        {" "}
        Snapshot generated {formatDateTime(snapshot.generatedAt)}.{" "}
      </p>{" "}
    </div>
  );
}
