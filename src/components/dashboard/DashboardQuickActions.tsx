"use client";

import Link from "next/link";
import { ArrowUpRight, PieChart, TrendingUp, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/deposits",
    label: "Fund Wallet",
    description: "Add naira to your balance",
    icon: Wallet,
    accent: "from-[var(--emerald)] to-[var(--emerald-mid)]",
    primary: true
  },
  {
    href: "/investments",
    label: "Invest Now",
    description: "Start earning today",
    icon: TrendingUp,
    accent: "from-[var(--navy)] to-[var(--navy-mid)]",
    primary: true
  },
  {
    href: "/team",
    label: "Invite Friends",
    description: "Earn referral rewards",
    icon: Users,
    accent: "from-violet-600 to-violet-700",
    primary: false
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    description: "Track your investments",
    icon: PieChart,
    accent: "from-[var(--gold)] to-[var(--gold-mid)]",
    primary: false
  },
  {
    href: "/withdrawals",
    label: "Request Payout",
    description: "Withdraw to your bank",
    icon: ArrowUpRight,
    accent: "from-sky-600 to-sky-700",
    primary: false
  }
] as const;

export function DashboardQuickActions({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-6", className)}>
      {actions.map(({ href, label, description, icon: Icon, accent, primary }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--emerald)]/30 hover:shadow-[var(--shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--emerald-mid)]",
            primary ? "p-5 lg:col-span-1 sm:col-span-1" : "p-4 lg:col-span-1"
          )}
        >
          <div
            className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-[0.06] transition-opacity group-hover:opacity-[0.14]", accent)}
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-105",
                accent,
                primary ? "h-12 w-12" : "h-10 w-10"
              )}
            >
              <Icon size={primary ? 20 : 18} strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className={cn("font-semibold text-[var(--heading)]", primary && "text-base")}>{label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">{description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
