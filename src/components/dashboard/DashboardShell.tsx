"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/company";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { dashboardNavItems, getDashboardNavLabel, mobileDashboardNavItems } from "@/lib/dashboard/nav";
import { getInitials } from "@/lib/utils/avatar";
import { WeeklyCountdown } from "@/components/roi/WeeklyCountdown";

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
  onNavigate
}: {
  fullName: string;
  email?: string;
  avatarUrl?: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const initials = getInitials(fullName);

  return (
    <>
      <div className="relative overflow-hidden border-b border-[var(--border)] px-4 py-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--emerald)]/10 via-transparent to-transparent" aria-hidden />
        <div className="relative flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-[var(--emerald)]/20" />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--emerald-soft)] text-sm font-semibold text-[var(--emerald)] ring-2 ring-[var(--emerald)]/20">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--heading)]">{fullName}</p>
            {email ? <p className="truncate text-xs text-[var(--text-muted)]">{email}</p> : null}
            <p className="truncate text-[10px] text-[var(--emerald)]">{COMPANY.brand} member</p>
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
                active
                  ? "bg-[var(--sidebar-active)] text-[var(--emerald)]"
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

  return (
    <div className="min-h-dvh bg-[var(--dashboard-bg)] lg:flex">
      <aside className="dashboard-sidebar hidden lg:flex">
        <div className="mb-4 px-2">
          <BrandLogo variant="full" href="/dashboard" priority />
        </div>
        <NavPanel fullName={fullName} email={email} avatarUrl={avatarUrl} />
        <div className="mt-auto flex items-center gap-2 border-t border-[var(--border)] p-3">
          <ThemeToggle compact />
          <Link
            href="/"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-center text-xs text-[var(--sidebar-muted)] transition hover:text-[var(--sidebar-text)]"
          >
            ← Website
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
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
                <BrandLogo variant="icon" href="/dashboard" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--heading)]">{isOverview ? "Overview" : pageLabel}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{COMPANY.brand} · Member portal</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle compact />
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm" className="gap-2">
                  <LogOut size={16} aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </div>
          </div>
          <div className="px-4 pb-3 lg:px-8">
            <WeeklyCountdown className="w-full justify-between" />
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[min(100vw-1rem,20rem)] flex-col bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <BrandLogo variant="full" href="/dashboard" />
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                  <X size={22} />
                </button>
              </div>
              <div className="flex max-h-[calc(100dvh-56px)] flex-col overflow-y-auto">
                <NavPanel fullName={fullName} email={email} avatarUrl={avatarUrl} onNavigate={() => setMobileOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="dashboard-main mx-auto max-w-6xl space-y-6 !px-4 !py-5 sm:space-y-8 sm:!py-6 lg:!px-8 lg:!py-8">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[var(--border)] bg-[var(--surface-raised)] px-1 py-1.5 lg:hidden" aria-label="Mobile dashboard">
          {mobileDashboardNavItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition",
                  active ? "text-[var(--emerald)]" : "text-[var(--text-subtle)]"
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
