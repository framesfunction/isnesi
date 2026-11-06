import { Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminModule } from "@/lib/permissions/admin-nav";
import { permissionLabel } from "@/lib/permissions/permissions";
/** * Scaffold view for an admin module that has not been implemented yet. * * It is explicit about the contract the finished module must satisfy: the route, * the permission that guards it, the tables it owns and the controls that must * ship with it. Nothing here pretends to be working CRUD. */ export function ModuleScaffold({
  module,
  allowed,
}: {
  module: AdminModule;
  allowed: boolean;
}) {
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl">
        {" "}
        <Card className="border border-line">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="flex items-center gap-2 text-lg font-black text-brand">
              {" "}
              <Lock aria-hidden="true" className="size-5" /> {module.label} is
              restricted{" "}
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent className="text-sm text-ink-muted">
            {" "}
            <p>
              {" "}
              Your account does not have the{" "}
              <strong className="text-ink">{module.permission}</strong>{" "}
              permission, so this module is not available. Permissions are
              assigned to roles server-side and are enforced again by Row Level
              Security.{" "}
            </p>{" "}
            <p className="mt-3">
              {" "}
              Ask an ISNESI administrator if you need access. The request is
              recorded; access is never granted by a browser action.{" "}
            </p>{" "}
            <p className="mt-4">
              {" "}
              <Link
                href="/admin"
                className="font-bold text-brand hover:underline"
              >
                {" "}
                ← Back to the dashboard{" "}
              </Link>{" "}
            </p>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl">
      {" "}
      <AdminPageHeader
        eyebrow="Planned module"
        title={module.label}
        description={module.description}
        actions={
          <Badge variant="warning">Scaffolded — not yet connected</Badge>
        }
      />{" "}
      <div className="grid gap-5 lg:grid-cols-2">
        {" "}
        <Card className="border border-line">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="font-display text-base font-extrabold text-brand">
              {" "}
              What this module is responsible for{" "}
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent className="text-sm text-ink-muted">
            {" "}
            <p>{module.purpose}</p>{" "}
            <dl className="mt-4 grid gap-3 text-xs">
              {" "}
              <div>
                {" "}
                <dt className="font-black uppercase tracking-[0.12em] text-ink-muted">
                  Route
                </dt>{" "}
                <dd className="mt-0.5 font-mono text-sm text-brand">
                  {module.href}
                </dd>{" "}
              </div>{" "}
              <div>
                {" "}
                <dt className="font-black uppercase tracking-[0.12em] text-ink-muted">
                  {" "}
                  Required permission{" "}
                </dt>{" "}
                <dd className="mt-0.5 font-mono text-sm text-brand">
                  {module.permission}
                </dd>{" "}
                <dd className="text-ink-muted">
                  {permissionLabel(module.permission)}
                </dd>{" "}
              </div>{" "}
              <div>
                {" "}
                <dt className="font-black uppercase tracking-[0.12em] text-ink-muted">
                  Tables
                </dt>{" "}
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {" "}
                  {module.tables.map((table) => (
                    <span
                      key={table}
                      className="rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[11px] text-brand"
                    >
                      {" "}
                      {table}{" "}
                    </span>
                  ))}{" "}
                </dd>{" "}
              </div>{" "}
            </dl>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="border border-line">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="font-display text-base font-extrabold text-brand">
              {" "}
              Capabilities to deliver{" "}
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <ul className="grid gap-2 text-sm text-ink-muted">
              {" "}
              {module.capabilities.map((capability) => (
                <li key={capability} className="flex gap-2">
                  {" "}
                  <span
                    aria-hidden="true"
                    className="mt-1 size-1.5 shrink-0 rounded-full bg-leaf"
                  />{" "}
                  <span>{capability}</span>{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="border border-coral/40 bg-white lg:col-span-2">
          {" "}
          <CardHeader>
            {" "}
            <CardTitle className="flex items-center gap-2 font-display text-base font-extrabold text-brand">
              {" "}
              <ShieldCheck
                aria-hidden="true"
                className="size-5 text-coral"
              />{" "}
              Controls that must ship with this module{" "}
            </CardTitle>{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <ul className="grid gap-2 text-sm text-ink">
              {" "}
              {module.security.map((rule) => (
                <li key={rule} className="flex gap-2">
                  {" "}
                  <span
                    aria-hidden="true"
                    className="mt-1 size-1.5 shrink-0 rounded-full bg-coral"
                  />{" "}
                  <span>{rule}</span>{" "}
                </li>
              ))}{" "}
            </ul>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
      <p className="mt-6 text-xs text-ink-muted">
        {" "}
        Nothing on this screen writes data. The route, the permission guard and
        the database tables are in place; the working interface is delivered in
        the implementation phase for this module.{" "}
      </p>{" "}
    </div>
  );
}
