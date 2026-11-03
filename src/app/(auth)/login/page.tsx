import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { BrandMark } from "@/components/shared/brand-mark";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/validation/auth";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    signedOut?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next, "/admin");
  const configured = isSupabaseConfigured();

  return (
    <div>
      <div className="lg:hidden">
        <BrandMark variant="header" />
      </div>

      <p className="mt-8 text-xs font-black uppercase tracking-[0.16em] text-leaf lg:mt-0">
        Staff access
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-brand">Sign in to ISNESI</h1>
      <p className="mt-3 text-sm text-ink-muted">
        This area is for authorised ISNESI staff. Every sign-in and administrative action is
        recorded in the audit log.
      </p>

      {params.signedOut ? (
        <p role="status" className="mt-6 rounded-xl border-2 border-leaf/30 bg-leaf-soft p-3 text-sm font-semibold text-ink">
          You have been signed out.
        </p>
      ) : null}

      {params.error === "callback" ? (
        <p role="alert" className="mt-6 rounded-xl border-2 border-destructive/30 bg-white p-3 text-sm font-semibold text-destructive">
          That sign-in link is invalid or has expired. Please try again or request a new invitation.
        </p>
      ) : null}

      {configured ? (
        <LoginForm next={next} />
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-sun/60 bg-sun-soft p-5 text-sm text-ink">
          <strong className="font-black">Authentication is not configured.</strong>
          <p className="mt-2">
            Set <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            in <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
            to enable staff sign-in.
          </p>
        </div>
      )}

      <p className="mt-8 text-sm">
        <Link href="/" className="font-semibold text-brand hover:underline">
          ← Back to the public website
        </Link>
      </p>
    </div>
  );
}