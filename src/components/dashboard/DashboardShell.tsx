"use client";

import { useEffect, useState } from "react";
import { dashboardNavItems, getDashboardNavLabel, mobileDashboardNavItems } from "@/lib/dashboard/nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { MARKETING_HOME } from "@/lib/pwa/config";

type Props = {
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
};

function NavPanel({
  fullName,
  email,
  avatarUrl,
  onNavigate,
  variant = "surface"
}: {
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  onNavigate?: () => void;
  variant?: "sidebar" | "surface";
}) {
  const pathname = usePathname();
  const isSidebar = variant === "sidebar";

  return (
    <>
      <div
        className={cn(
          "border-b px-4 py-5",
          isSidebar ? "sidebar-border border-white/10" : "border-[var(--border)]"
        )}
      >
        <div className="flex items-center gap-3">
          <MemberAvatar fullName={fullName} avatarUrl={avatarUrl} size="md" variant={isSidebar ? "sidebar" : "default"} />
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-semibold",
                isSidebar ? "text-[var(--sidebar-text)]" : "text-[var(--heading)]"
              )}
            >
              {fullName}
            </p>
            {email ? (
              <p className={cn("truncate text-xs", isSidebar ? "text-[var(--sidebar-muted)]" : "text-[var(--text-muted)]")}>
                {email}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Dashboard">
        {dashboardNavItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition",
                isSidebar
                  ? active
                    ? "bg-[var(--sidebar-active)] text-[var(--emerald-light)]"
                    : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                  : active
                    ? "bg-[var(--emerald-soft)] text-[var(--emerald)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--gray-100)] hover:text-[var(--heading)]"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.25 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function DashboardShell({ fullName, email, avatarUrl, children }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageLabel = getDashboardNavLabel(pathname);
  const isOverview = pathname === "/dashboard";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    document.body.dataset.mobileNav = "true";
    return () => {
      delete document.body.dataset.mobileNav;
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[var(--dashboard-bg)] lg:flex">
      <aside className="dashboard-sidebar sidebar-surface hidden lg:flex">
        <div className="mb-4 px-2">
          <BrandLogo variant="full" href={MARKETING_HOME} priority />
        </div>
        <NavPanel fullName={fullName} email={email} avatarUrl={avatarUrl} variant="sidebar" />
        <div className="mt-auto flex flex-col gap-2 border-t border-white/10 p-3">
          <ThemeToggle compact />
          <Link
            href="/download"
            className="flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-white/15 px-3 py-2 text-xs text-[var(--sidebar-muted)] transition hover:border-white/25 hover:text-[var(--sidebar-text)]"
          >
            <Download size={14} aria-hidden />
            Get the app
          </Link>
          <Link
            href={MARKETING_HOME}
            className="rounded-[var(--radius-sm)] border border-white/15 px-3 py-2 text-center text-xs text-[var(--sidebar-muted)] transition hover:border-white/25 hover:text-[var(--sidebar-text)]"
          >
            ← Website
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--dashboard-bg)]/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 shrink-0 p-0 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu size={18} />
                </Button>
                <div className="min-w-0 lg:hidden">
                  <BrandLogo variant="icon" href={MARKETING_HOME} />
                </div>
                <div className="min-w-0 hidden lg:block">
                  <p className="truncate text-base font-semibold tracking-tight text-[var(--heading)]">
                    {isOverview ? "Overview" : pageLabel}
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                {!isOverview ? <MemberAvatar fullName={fullName} avatarUrl={avatarUrl} size="sm" /> : null}
                <ThemeToggle compact />
                <form action="/api/auth/logout" method="post">
                  <Button type="submit" variant="outline" size="sm" className="gap-2">
                    <LogOut size={16} aria-hidden />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                </form>
              </div>

              <div className="flex items-center gap-2 sm:hidden">
                <ThemeToggle compact />
                <form action="/api/auth/logout" method="post">
                  <Button type="submit" variant="outline" size="sm" className="h-10 w-10 p-0" aria-label="Sign out">
                    <LogOut size={16} />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[min(100vw-1rem,20rem)] flex-col bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <BrandLogo variant="full" href={MARKETING_HOME} />
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="text-[var(--text-muted)]">
                  <X size={22} />
                </button>
              </div>
              <div className="flex max-h-[calc(100dvh-56px)] flex-col overflow-y-auto">
                <NavPanel
                  fullName={fullName}
                  email={email}
                  avatarUrl={avatarUrl}
                  onNavigate={() => setMobileOpen(false)}
                  variant="surface"
                />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="dashboard-main mx-auto max-w-6xl space-y-6 !px-4 !pb-20 !pt-5 sm:space-y-8 sm:!py-6 lg:!px-8 lg:!py-8 lg:!pb-8">
          {children}
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--surface-raised)]/95 px-1 py-1.5 backdrop-blur-md lg:hidden"
          aria-label="Mobile dashboard"
        >
          {mobileDashboardNavItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition",
                  active ? "text-[var(--emerald)]" : "text-[var(--text-muted)]"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
