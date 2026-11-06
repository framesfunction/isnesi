import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  assignUserRoleAction,
  revokeUserRoleAction,
  setUserActiveAction,
} from "@/features/users/actions";
import {
  listAdminUsers,
  listAdminRoles,
  type AdminUserListItem,
} from "@/features/users/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
export const metadata: Metadata = { title: "Users & permissions" };
export const dynamic = "force-dynamic";
const ACTIVE_LABELS: Record<string, string> = {
  true: "Active",
  false: "Inactive",
};
const INPUT_CLASS =
  "min-h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink";
type PageSearchParams = { q?: string; role?: string; active?: string };
/* Plain form actions (single FormData argument) */ async function handleSetUserActive(
  formData: FormData,
): Promise<void> {
  "use server";
  await setUserActiveAction(undefined, formData);
}
async function handleRevokeUserRole(formData: FormData): Promise<void> {
  "use server";
  await revokeUserRoleAction(undefined, formData);
}
async function handleAssignUserRole(formData: FormData): Promise<void> {
  "use server";
  await assignUserRoleAction(undefined, formData);
}
function ActiveToggle({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  return (
    <form action={handleSetUserActive} className="inline">
      {" "}
      <input type="hidden" name="userId" value={userId} />{" "}
      <input type="hidden" name="isActive" value={String(!isActive)} />{" "}
      <Button
        type="submit"
        size="sm"
        variant={isActive ? "destructive" : "default"}
      >
        {" "}
        {isActive ? "Deactivate" : "Reactivate"}{" "}
      </Button>{" "}
    </form>
  );
}
function RoleRevoke({ userId, roleId }: { userId: string; roleId: string }) {
  return (
    <form action={handleRevokeUserRole} className="inline">
      {" "}
      <input type="hidden" name="userId" value={userId} />{" "}
      <input type="hidden" name="roleId" value={roleId} />{" "}
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="text-coral-strong bg-transparent hover:bg-coral/10 border-transparent"
      >
        {" "}
        ×{" "}
      </Button>{" "}
    </form>
  );
}
function RoleAssign({
  userId,
  roles,
  existingKeys,
}: {
  userId: string;
  roles: Array<{ id: string; key: string; name: string }>;
  existingKeys: string[];
}) {
  const available = roles.filter((r) => !existingKeys.includes(r.key));
  if (available.length === 0) return null;
  return (
    <form action={handleAssignUserRole} className="flex items-end gap-2">
      {" "}
      <input type="hidden" name="userId" value={userId} />{" "}
      <Select
        name="roleId"
        defaultValue=""
        className="min-h-8 w-32 text-[11px]"
      >
        {" "}
        <option value="">Assign role</option>{" "}
        {available.map((r) => (
          <option key={r.id} value={r.id}>
            {" "}
            {r.name}{" "}
          </option>
        ))}{" "}
      </Select>{" "}
      <Button type="submit" size="sm" variant="secondary">
        {" "}
        Assign{" "}
      </Button>{" "}
    </form>
  );
}
function Row({
  user,
  allRoles,
}: {
  user: AdminUserListItem;
  allRoles: Array<{ id: string; key: string; name: string }>;
}) {
  return (
    <tr key={user.id} className="border-t border-line/70">
      {" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-line text-[10px] font-bold text-ink-muted">
            {" "}
            {user.displayName ?? (user.email ?? "U")![0]?.toUpperCase()}{" "}
          </span>{" "}
          <div>
            {" "}
            <p className="font-bold text-ink">
              {user.displayName ?? user.email ?? "Unknown"}
            </p>{" "}
            <p className="text-[10px] text-ink-muted">
              {user.email ?? "—"}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top">
        {" "}
        {user.roles.map((key, i) => {
          const role = allRoles.find((r) => r.key === key);
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full bg-leaf-soft px-2 py-0.5 text-[10px] font-bold text-leaf-strong"
            >
              {" "}
              {key}{" "}
              <RoleRevoke userId={user.id} roleId={role?.id ?? key} />{" "}
            </span>
          );
        })}{" "}
        {user.roles.length === 0 && (
          <span className="text-[10px] text-ink-muted">No roles</span>
        )}{" "}
        <RoleAssign
          userId={user.id}
          roles={allRoles}
          existingKeys={user.roles}
        />{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top">
        {" "}
        <StatusBadge
          status={user.isActive ? "active" : "inactive"}
          labels={ACTIVE_LABELS}
        />{" "}
      </td>{" "}
      <td className="px-3 py-3 align-top text-xs text-ink-muted">
        {" "}
        {formatDate(user.updatedAt)}{" "}
      </td>{" "}
      <td className="px-3 py-3 text-right align-top">
        {" "}
        <ActiveToggle userId={user.id} isActive={user.isActive} />{" "}
        <LinkEdit userId={user.id} />{" "}
      </td>{" "}
    </tr>
  );
}
function LinkEdit({ userId }: { userId: string }) {
  return (
    <a
      href={`/admin/users/${userId}`}
      className="ml-2 text-sm font-bold text-brand hover:underline"
    >
      {" "}
      Edit{" "}
    </a>
  );
}
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { allowed } = await requirePermission("users.manage", "/admin/users");
  if (!allowed) {
    return (
      <EmptyState
        title="This module is restricted."
        description="Your account does not have the users.manage permission."
      />
    );
  }
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const role = (params.role ?? "").trim();
  const active = (params.active ?? "").trim();
  const [users, allRoles] = await Promise.all([
    listAdminUsers(),
    listAdminRoles(),
  ]);
  if (users === null || allRoles === null) {
    return (
      <Card className="border border-coral/40">
        {" "}
        <CardContent className="p-6 text-sm text-ink-muted">
          {" "}
          The database is not connected, so user management could not be loaded.
          Configure Supabase and reload.{" "}
        </CardContent>{" "}
      </Card>
    );
  }
  const filtered = users.filter((u) => {
    if (q) {
      const haystack = `${u.displayName ?? ""} ${u.email ?? ""}`.toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    if (role && !u.roles.includes(role)) return false;
    if (active === "true" && !u.isActive) return false;
    if (active === "false" && u.isActive) return false;
    return true;
  });
  return (
    <div className="mx-auto max-w-6xl">
      {" "}
      <AdminPageHeader
        eyebrow="Administration"
        title="Users & permissions"
        description="Staff accounts, role assignments and account state."
      />{" "}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {" "}
        <Card className="border border-line rounded-xl p-4">
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Total staff
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">
            {filtered.length}
          </p>{" "}
        </Card>{" "}
        <Card className="border border-line rounded-xl p-4">
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Active
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-leaf-strong">
            {" "}
            {filtered.filter((u) => u.isActive).length}{" "}
          </p>{" "}
        </Card>{" "}
        <Card className="border border-line rounded-xl p-4">
          {" "}
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Inactive
          </p>{" "}
          <p className="mt-1 font-display text-2xl font-extrabold text-coral-strong">
            {" "}
            {filtered.filter((u) => !u.isActive).length}{" "}
          </p>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="mb-6">
        {" "}
        <form
          action="/admin/users"
          method="get"
          className="grid gap-3 sm:grid-cols-4"
        >
          {" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <Label htmlFor="userSearch">Search</Label>{" "}
            <input
              id="userSearch"
              name="q"
              defaultValue={q}
              placeholder="Name or email"
              className={INPUT_CLASS}
            />{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <Label htmlFor="userRole">Role</Label>{" "}
            <Select name="role" defaultValue={role} className={INPUT_CLASS}>
              {" "}
              <option value="">All roles</option>{" "}
              {allRoles.map((r) => (
                <option key={r.id} value={r.key}>
                  {" "}
                  {r.name}{" "}
                </option>
              ))}{" "}
            </Select>{" "}
          </div>{" "}
          <div className="flex flex-col gap-1.5">
            {" "}
            <Label htmlFor="userActive">Status</Label>{" "}
            <Select name="active" defaultValue={active} className={INPUT_CLASS}>
              {" "}
              <option value="">All</option> <option value="true">Active</option>{" "}
              <option value="false">Inactive</option>{" "}
            </Select>{" "}
          </div>{" "}
          <Button type="submit" size="sm">
            {" "}
            Apply{" "}
          </Button>{" "}
        </form>{" "}
      </div>{" "}
      <Card className="mb-8 border border-line">
        {" "}
        <CardHeader>
          {" "}
          <CardTitle className="font-display text-base font-extrabold text-brand">
            {" "}
            Staff ({filtered.length}){" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent>
          {" "}
          <DataTable
            columns={[
              { key: "name", label: "Staff member" },
              { key: "roles", label: "Roles" },
              { key: "active", label: "Status" },
              { key: "updated", label: "Updated" },
              {
                key: "actions",
                label: "Actions",
                align: "right",
                srOnly: true,
              },
            ]}
            isEmpty={filtered.length === 0}
            empty={
              <EmptyState
                title="No staff found."
                description={
                  q || role || active
                    ? "Try a different filter."
                    : "No staff accounts yet."
                }
              />
            }
          >
            {" "}
            {filtered.map((user) => (
              <Row key={user.id} user={user} allRoles={allRoles} />
            ))}{" "}
          </DataTable>{" "}
        </CardContent>{" "}
      </Card>{" "}
    </div>
  );
}
