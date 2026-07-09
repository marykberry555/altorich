"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, Wallet, X, TrendingUp, ArrowDownLeft, ArrowUpRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/company";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";

const navSections = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }]
  },
  {
    label: "Operations",
    items: [
      { href: "/admin#deposits", label: "Deposits", icon: ArrowDownLeft },
      { href: "/admin#withdrawals", label: "Withdrawals", icon: ArrowUpRight },
      { href: "/admin#investments", label: "Investments", icon: TrendingUp },
      { href: "/admin#plans", label: "Plans", icon: Wallet }
    ]
  },
  {
    label: "System",
    items: [{ href: "/admin#settings", label: "Settings", icon: Settings }]
  }
];

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Admin navigation">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-subtle)]">{section.label}</p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = "exact" in item && item.exact ? pathname === item.href : pathname.startsWith(item.href.split("#")[0]);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition",
                    active ? "bg-[var(--emerald-soft)] font-medium text-[var(--emerald)]" : "text-[var(--text-muted)] hover:bg-[var(--gray-100)] hover:text-[var(--heading)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="px-2.5">
        <Link href="/dashboard" className="text-xs text-[var(--text-muted)] hover:text-[var(--emerald)]">
          ← Member dashboard
        </Link>
      </div>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--dashboard-bg)] lg:flex">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-raised)] lg:flex">
        <div className="border-b border-[var(--border)] px-4 py-5">
          <BrandLogoStatic variant="full" href="/admin" />
          <p className="mt-2 text-xs text-[var(--text-muted)]">Operations centre</p>
          <p className="text-[10px] text-[var(--text-subtle)]">{COMPANY.legalName}</p>
        </div>
        <AdminNav />
        <div className="border-t border-[var(--border)] p-3">
          <ThemeToggle />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-10 w-10 p-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open admin menu">
              <Menu size={18} />
            </Button>
            <div>
              <p className="text-sm font-semibold text-[var(--heading)]">Admin · {COMPANY.brand}</p>
              <p className="text-xs text-[var(--text-muted)]">Financial operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline" size="sm" className="gap-2">
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Close" />
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-[var(--surface-raised)] shadow-[var(--shadow-lg)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                <span className="text-sm font-semibold">Admin menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <AdminNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}