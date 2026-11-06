import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModuleScaffold } from "@/components/admin/module-scaffold";
import { requirePermission } from "@/lib/auth/guards";
import { getAdminModule } from "@/lib/permissions/admin-nav";

type AdminModulePageProps = {
  params: Promise<{ module: string }>;
};

export async function generateMetadata({
  params,
}: AdminModulePageProps): Promise<Metadata> {
  const { module: moduleKey } = await params;
  const adminModule = getAdminModule(moduleKey);
  return { title: adminModule?.label ?? "Admin" };
}

/**
 * Every admin module route.
 *
 * A single dynamic segment keeps the module contract in one place
 * (`lib/permissions/admin-nav.ts`): each route resolves its module, checks the
 * required permission server-side and renders the scaffold until the working
 * interface is implemented.
 *
 * Modules graduate to their own folders (for example `admin/pages/[...]`) as they
 * are built; this route is the documented entry point until then.
 */
export default async function AdminModulePage({
  params,
}: AdminModulePageProps) {
  const { module: moduleKey } = await params;
  const adminModule = getAdminModule(moduleKey);

  // The dashboard is a real route at /admin, and unknown keys are 404s.
  if (!adminModule || adminModule.key === "dashboard") notFound();

  const { allowed } = await requirePermission(
    adminModule.permission,
    adminModule.href,
  );

  return <ModuleScaffold module={adminModule} allowed={allowed} />;
}
