"use client";

import {
  Accessibility,
  BookOpen,
  HandCoins,
  Handshake,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  ListTree,
  Mail,
  Newspaper,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { BrandMark } from "@/components/shared/brand-mark";
import { signOutAction } from "@/features/auth/actions";
export type AdminShellGroup = {
  key: string;
  label: string;
  modules: {
    key: string;
    label: string;
    href: string;
    icon: string;
    description: string;
  }[];
};
export type AdminShellUser = {
  displayName: string | null;
  email: string | null;
  roleLabels: string[];
};
const ICONS: Record<string, ReactNode> = {
  "layout-dashboard": <LayoutDashboard className="size-4" />,
  "layout-template": <LayoutTemplate className="size-4" />,
  sparkles: <Sparkles className="size-4" />,
  newspaper: <Newspaper className="size-4" />,
  images: <Images className="size-4" />,
  handshake: <Handshake className="size-4" />,
  "list-tree": <ListTree className="size-4" />,
  mail: <Mail className="size-4" />,
  "shield-check": <ShieldCheck className="size-4" />,
  "hand-coins": <HandCoins className="size-4" />,
  send: <Send className="size-4" />,
  smile: <Smile className="size-4" />,
  users: <Users className="size-4" />,
  settings: <Settings className="size-4" />,
  accessibility: <Accessibility className="size-4" />,
  "scroll-text": <ScrollText className="size-4" />,
  "trending-up": <TrendingUp className="size-4" />,
  tags: <Tags className="size-4" />,
  "book-open": <BookOpen className="size-4" />,
};
function initials(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "IS").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "I"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}
/** * Admin application chrome. * * The sidebar only lists modules the signed-in user may open, and every route * re-checks its permission on the server. Navigation is a convenience, never a * security boundary. */ export function AdminShell({
  user,
  groups,
  children,
}: {
  user: AdminShellUser;
  groups: AdminShellGroup[];
  children: ReactNode;
}) {
  const moduleLinks = groups.flatMap((group) =>
    group.modules.map((module) => ({ key: module.key, href: module.href })),
  );
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      // ? — help
      if (event.key === "?") {
        event.preventDefault();
        router.push("/admin/help");
        return;
      }

      // / — focus search
      if (event.key === "/") {
        event.preventDefault();
        const search = document.querySelector('input[type="search"]') as HTMLInputElement | null;
        search?.focus();
        return;
      }

      // 1-9 — switch module by index in navigation order
      const index = Number.parseInt(event.key, 10);
      if (!Number.isNaN(index) && index >= 1 && index <= 9) {
        const target = moduleLinks[index - 1];
        if (target) {
          event.preventDefault();
          router.push(target.href);
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [moduleLinks, router]);

  return (
    <div className="min-h-dvh bg-muted">
      {" "}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {" "}
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[264px_minmax(0,1fr)]">
        {" "}
        <aside className="admin-scroll bg-brand-strong text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-6 lg:overflow-y-auto lg:p-5">
          {" "}
          <div className="flex items-center justify-between gap-3 px-4 py-4 lg:px-0 lg:py-0">
            {" "}
            <Link
              href="/admin"
              className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
            >
              {" "}
              <span className="flex items-center gap-3">
                {" "}
                <span className="grid size-10 place-items-center rounded-xl bg-white text-base font-black text-brand">
                  {" "}
                  IS{" "}
                </span>{" "}
                <span>
                  {" "}
                  <span className="block text-sm font-black tracking-[0.12em]">
                    ISNESI
                  </span>{" "}
                  <span className="block text-[10px] uppercase tracking-[0.12em] text-white/60">
                    {" "}
                    Admin studio{" "}
                  </span>{" "}
                </span>{" "}
              </span>{" "}
            </Link>{" "}
            <Link
              href="/"
              className="rounded-full border border-white/25 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-white/80 hover:bg-white/10 lg:hidden"
            >
              {" "}
              View site{" "}
            </Link>{" "}
          </div>{" "}
          <nav
            aria-label="Admin sections"
            className="admin-scroll flex gap-4 overflow-x-auto px-4 pb-4 lg:block lg:flex-1 lg:space-y-5 lg:px-0 lg:pb-0"
          >
            {" "}
            {groups.map((group) => (
              <div key={group.key} className="min-w-max lg:min-w-0">
                {" "}
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                  {" "}
                  {group.label}{" "}
                </p>{" "}
                <div className="flex gap-1 lg:block lg:space-y-1">
                  {" "}
                  {group.modules.map((module) => (
                    <AdminNavLink
                      key={module.key}
                      href={module.href}
                      label={module.label}
                      description={module.description}
                      icon={
                        ICONS[module.icon] ?? (
                          <LayoutDashboard className="size-4" />
                        )
                      }
                      exact={module.key === "dashboard"}
                    />
                  ))}{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </nav>{" "}
          <div className="hidden border-t border-white/15 pt-4 lg:block">
            {" "}
            <div className="flex items-center gap-3 px-1">
              {" "}
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-sun text-xs font-black text-ink"
              >
                {" "}
                {initials(user.displayName, user.email)}{" "}
              </span>{" "}
              <span className="min-w-0">
                {" "}
                <span className="block truncate text-sm font-bold">
                  {" "}
                  {user.displayName ?? user.email ?? "Staff"}{" "}
                </span>{" "}
                <span className="block truncate text-[11px] text-white/60">
                  {" "}
                  {user.roleLabels.length > 0
                    ? user.roleLabels.join(", ")
                    : "No roles assigned"}{" "}
                </span>{" "}
              </span>{" "}
            </div>{" "}
            <form action={signOutAction} className="mt-3">
              {" "}
                <button
                  type="submit"
                  className="w-full rounded-xl border border-white/20 px-3 py-2.5 min-h-[44px] text-xs font-bold text-white/80 hover:bg-white/10"
                >
                {" "}
                Sign out{" "}
              </button>{" "}
            </form>{" "}
          </div>{" "}
        </aside>{" "}
        <div className="flex min-w-0 flex-col">
          {" "}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-5 py-3 backdrop-blur">
            {" "}
            <BrandMark variant="admin" href={null} className="lg:hidden" />{" "}
            <p className="hidden text-xs font-bold uppercase tracking-[0.14em] text-ink-muted lg:block">
              {" "}
              ISNESI Admin{" "}
            </p>{" "}
            <div className="flex items-center gap-2">
              {" "}
              <Link
                href="/admin/help"
                className="hidden rounded-full border border-line px-4 py-2.5 min-h-[44px] text-xs font-bold text-ink-muted transition-colors hover:border-brand hover:text-brand sm:inline-flex"
              >
                {" "}
                How to use this{" "}
              </Link>{" "}
              <Link
                href="/"
                className="hidden rounded-full border border-line px-4 py-2.5 min-h-[44px] text-xs font-bold text-ink-muted transition-colors hover:border-brand hover:text-brand sm:inline-flex"
              >
                {" "}
                View public site{" "}
              </Link>{" "}
              <form action={signOutAction} className="lg:hidden">
                {" "}
                <button
                  type="submit"
                  className="rounded-full bg-brand px-4 py-2.5 min-h-[44px] text-xs font-bold text-white"
                >
                  {" "}
                  Sign out{" "}
                </button>{" "}
              </form>{" "}
            </div>{" "}
          </header>{" "}
          <main id="main-content" className="min-w-0 flex-1 px-5 py-8">
            {" "}
            {children}{" "}
          </main>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
