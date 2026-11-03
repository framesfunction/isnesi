import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminShell, type AdminShellGroup } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/guards";
import { groupedAdminNavigation } from "@/lib/permissions/admin-nav";
import { roleLabel } from "@/lib/permissions/permissions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ISNESI Admin" },
  robots: { index: false, follow: false },
};

/**
 * Admin layout.
 *
 * `requireAdmin()` runs on every admin render: unauthenticated visitors are sent
 * to /login (the middleware also blocks them earlier), and signed-in accounts
 * without `admin.access` are sent to /no-access.
 *
 * The navigation handed to the shell is already filtered by permission, but each
 * page re-checks its own permission before rendering data.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  const groups: AdminShellGroup[] = groupedAdminNavigation(user).map((group) => ({
    key: group.group,
    label: group.label,
    modules: group.modules.map((module) => ({
      key: module.key,
      label: module.label,
      href: module.href,
      icon: module.icon,
      description: module.description,
    })),
  }));

  return (
    <AdminShell
      user={{
        displayName: user.displayName,
        email: user.email,
        roleLabels: user.roles.map((role) => roleLabel(role.key)),
      }}
      groups={groups}
    >
      {children}
    </AdminShell>
  );
}