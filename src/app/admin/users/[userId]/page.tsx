import type { Metadata } from "next";
import Link from "next/link";

import { ActionForm } from "@/components/admin/action-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  setUserActiveAction,
  updateUserProfileAction,
} from "@/features/users/actions";
import { getAdminUser } from "@/features/users/admin-queries";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Edit user" };
export const dynamic = "force-dynamic";

const FIELD_LABELS =
  "flex flex-col gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-ink-muted";
const INPUT_CLASS = "min-h-10 rounded-xl border-2 border-line bg-white px-3 text-sm text-ink";

type PageParams = {
  userId: string;
};

/* Plain form action (single FormData argument) */

async function handleSetUserActive(formData: FormData): Promise<void> {
  "use server";
  await setUserActiveAction(undefined, formData);
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<PageParams>;
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

  const { userId } = await params;
  const user = await getAdminUser(userId);

  if (user === null) {
    return (
      <Card className="border-2 border-coral/40">
        <CardContent className="p-6 text-sm text-ink-muted">
          The database is not connected, so this user could not be loaded.
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <EmptyState title="User not found." description="This staff account does not exist." />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <AdminPageHeader
        eyebrow="Administration"
        title="Edit user"
        description={`Manage ${user.displayName ?? user.email ?? "this account"}.`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="border-2 border-line rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Status</p>
          <p className={`mt-1 text-sm font-bold ${user.isActive ? "text-leaf" : "text-coral"}`}>
            {user.isActive ? "Active" : "Inactive"}
          </p>
        </Card>
        <Card className="border-2 border-line rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Roles</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {user.roleGrants.map((g) => g.roleKey).join(", ") || "None"}
          </p>
        </Card>
        <Card className="border-2 border-line rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Member since</p>
          <p className="mt-1 text-sm font-bold text-ink">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </Card>
      </div>

      <Card className="mb-8 border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm action={updateUserProfileAction} submitLabel="Save profile">
            <input type="hidden" name="userId" value={user.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={FIELD_LABELS}>
                <span>Display name</span>
                <input
                  type="text"
                  name="displayName"
                  defaultValue={user.displayName ?? ""}
                  className={INPUT_CLASS}
                />
              </label>
              <label className={FIELD_LABELS}>
                <span>Phone</span>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone ?? ""}
                  className={INPUT_CLASS}
                />
              </label>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Account state
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSetUserActive} className="flex items-center gap-3 p-4">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="isActive" value={String(!user.isActive)} />
            <Button
              type="submit"
              size="sm"
              variant={user.isActive ? "destructive" : "default"}
            >
              {user.isActive ? "Deactivate account" : "Reactivate account"}
            </Button>
            <p className="ml-auto text-xs text-ink-muted">
              {user.isActive
                ? "Deactivation revokes sessions and blocks future sign-in."
                : "Reactivation restores sign-in access."}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card className="border-2 border-line">
        <CardHeader>
          <CardTitle className="font-display text-base font-extrabold text-brand">
            Role grants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted mb-4">
            Role assignments below. Revoke a grant by removing it; add roles from the users list.
          </p>
          <div className="space-y-2">
            {user.roleGrants.map((grant) => (
              <div key={grant.roleId} className="flex items-center justify-between p-3 rounded-xl border border-line bg-white/50">
                <div>
                  <p className="font-medium text-ink">{grant.roleName}</p>
                  <p className="text-xs text-ink-muted">
                    {grant.roleKey} {grant.assignedAt ? `· assigned ${formatDate(grant.assignedAt)}` : ""}
                  </p>
                </div>
                {grant.expiresAt ? (
                  <p className="text-xs text-ink-muted">
                    Expires {formatDate(grant.expiresAt)}
                  </p>
                ) : null}
              </div>
            ))}
            {user.roleGrants.length === 0 && (
              <p className="text-xs text-ink-muted">No role grants assigned.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-2">
        <Link href="/admin/users">
          <Button variant="outline">Back to staff list</Button>
        </Link>
      </div>
    </div>
  );
}
