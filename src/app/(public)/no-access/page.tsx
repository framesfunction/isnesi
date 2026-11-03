import type { Metadata } from "next";
import Link from "next/link";

import { signOutAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "No access",
  robots: { index: false, follow: false },
};

/**
 * This page depends on the caller's session, so it must never be cached.
 * Without this it would inherit the public layout's 5-minute ISR window and could
 * show a stale "not signed in" state.
 */
export const dynamic = "force-dynamic";

/**
 * Shown when a signed-in account may not enter the admin application
 * (no `admin.access`), or when an account has been deactivated.
 *
 * This page is intentionally outside /admin so the proxy does not bounce the
 * user back into a loop.
 */
export default async function NoAccessPage() {
  const user = await getCurrentUser();

  return (
    <main id="main-content" className="mx-auto w-full max-w-xl px-5 py-24">
      <div className="rounded-3xl border-2 border-line bg-white p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">Access restricted</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-brand">
          Your account cannot open the admin panel
        </h1>

        {user ? (
          <>
            <p className="mt-4 text-ink-muted">
              You are signed in as <strong className="text-ink">{user.email}</strong>, but this
              account has no administrative access, or it has been deactivated.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              Ask an ISNESI administrator to assign the role you need. Roles are granted
              server-side and recorded in the audit log; access is never granted by a browser
              request.
            </p>

            {user.roles.length > 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                Current roles:{" "}
                <span className="font-semibold text-ink">
                  {user.roles.map((role) => role.name).join(", ")}
                </span>
              </p>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">No roles are currently assigned.</p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white"
                >
                  Sign out
                </button>
              </form>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center rounded-full border-2 border-brand px-6 text-sm font-bold text-brand"
              >
                Back to the website
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-ink-muted">
              You are not signed in. Staff access is limited to invited ISNESI accounts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white"
              >
                Staff sign in
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center rounded-full border-2 border-brand px-6 text-sm font-bold text-brand"
              >
                Back to the website
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}