"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Bug,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
  Crown,
  Headphones,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/company";
import { ADMIN_APP_HOME, adminAppPath } from "@/lib/admin-app/constants";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AdminNotificationBell } from "@/components/admin-app/AdminNotificationBell";
import { AdminInstallBanner } from "@/components/admin-app/AdminInstallBanner";
import { AdminInstallCta } from "@/components/admin-app/AdminInstallCta";
import { AdminGlobalSearch } from "@/components/admin-app/AdminGlobalSearch";

const navSections = [
  {
    label: "Overview",
    items: [{ href: ADMIN_APP_HOME, label: "Dashboard", icon: LayoutDashboard, exact: true }]
  },
  {
    label: "Operations",
    items: [
      { href: adminAppPath("/members"), label: "Members", icon: Users },
      { href: adminAppPath("/deposits"), label: "Deposits", icon: ArrowDownLeft },
      { href: adminAppPath("/payouts"), label: "Withdrawals", icon: ArrowUpRight },
      { href: adminAppPath("/liquidations"), label: "Liquidations", icon: Landmark },
      { href: adminAppPath("/investments"), label: "Investments", icon: TrendingUp },
      { href: adminAppPath("/plans"), label: "Packages", icon: Wallet },
      { href: adminAppPath("/funding-accounts"), label: "Funding accounts", icon: Wallet },
      { href: adminAppPath("/settlements"), label: "Settlements", icon: TrendingUp }
    ]
  },
  {
    label: "Programmes",
    items: [
      { href: adminAppPath("/referrals"), label: "Referrals", icon: Users },
      { href: adminAppPath("/referrals"), label: "VIP levels", icon: Crown }
    ]
  },
  {
    label: "Monitoring",
    items: [
      { href: adminAppPath("/notifications"), label: "Notifications", icon: Bell },
      { href: adminAppPath("/financial-health"), label: "Financial health", icon: HeartPulse },
      { href: adminAppPath("/activity"), label: "Login activity", icon: Activity },
      { href: adminAppPath("/security"), label: "Security", icon: Shield },
      { href: adminAppPath("/audit"), label: "Audit logs", icon: ScrollText },
      { href: adminAppPath("/errors"), label: "Error log", icon: Bug },
      { href: adminAppPath("/reports"), label: "Reports", icon: FileText },
      { href: adminAppPath("/support"), label: "Support", icon: Headphones }
    ]
  },
  {
    label: "System",
    items: [{ href: adminAppPath("/settings"), label: "Settings", icon: Settings }]
  }
];

function AdminAppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Admin app navigation">
      {navSections.map((section) => (
        <div key={section.label}>
          <p
            className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em]"
            style={{ color: "var(--admin-subtle)" }}
          >
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={`${section.label}-${item.label}`}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm transition touch-manipulation",
                    active ? "font-medium" : ""
                  )}
                  style={
                    active
                      ? { background: "var(--admin-emerald-soft)", color: "var(--admin-emerald-text)" }
                      : { color: "var(--admin-muted)" }
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell min-h-dvh min-w-0 w-full lg:flex" style={{ background: "var(--admin-bg)", color: "var(--admin-text)" }}>
      <aside
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r lg:flex"
        style={{ background: "var(--admin-panel)", borderColor: "var(--admin-border)" }}
      >
        <div className="border-b px-4 py-5" style={{ borderColor: "var(--admin-border)" }}>
          <Link href={ADMIN_APP_HOME} className="flex items-center gap-3">
            <Image src="/admin-app/icon-192.png" alt="" width={40} height={40} className="rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--admin-heading)" }}>
                {COMPANY.brand} Admin
              </p>
              <p className="text-[10px]" style={{ color: "var(--admin-muted)" }}>
                Operations console
              </p>
            </div>
          </Link>
        </div>
        <AdminAppNav />
        <AdminInstallCta variant="footer" />
      </aside>

      <div className="min-w-0 flex-1">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-4 lg:px-8 lg:py-3"
          style={{
            background: "color-mix(in srgb, var(--admin-bg) 92%, transparent)",
            borderColor: "var(--admin-border)",
            paddingTop: "max(0.625rem, env(safe-area-inset-top, 0px))"
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="admin-touch h-11 w-11 shrink-0 p-0 lg:hidden"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-hover)", color: "var(--admin-text)" }}
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
            >
              <Menu size={18} />
            </Button>
            <AdminGlobalSearch />
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--admin-heading)" }}>
                Alto Rich Operations
              </p>
              <p className="truncate text-xs" style={{ color: "var(--admin-muted)" }}>
                {COMPANY.legalName}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle compact />
            <AdminNotificationBell />
            <form action="/api/auth/logout" method="post">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="admin-touch h-11 gap-2 px-3"
                style={{ borderColor: "var(--admin-border)", background: "var(--admin-hover)", color: "var(--admin-text)" }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0"
              style={{ background: "var(--admin-overlay)" }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
            />
            <aside
              className="absolute left-0 top-0 flex h-full w-[min(100%,18rem)] max-w-full flex-col shadow-2xl"
              style={{
                background: "var(--admin-panel)",
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)"
              }}
            >
              <div className="flex items-center justify-between border-b p-4" style={{ borderColor: "var(--admin-border)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--admin-heading)" }}>
                  Admin menu
                </span>
                <button
                  type="button"
                  className="admin-touch inline-flex items-center justify-center"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close"
                  style={{ color: "var(--admin-text)" }}
                >
                  <X size={20} />
                </button>
              </div>
              <AdminAppNav onNavigate={() => setMobileOpen(false)} />
              <AdminInstallCta variant="footer" />
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-3 py-5 sm:px-4 lg:px-8 lg:py-8">
          <AdminInstallBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
