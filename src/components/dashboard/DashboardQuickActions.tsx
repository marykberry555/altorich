"use client";

import Link from "next/link";
import { ArrowUpRight, PieChart, TrendingUp, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const catalog = [
  {
    href: "/deposits",
    label: "Fund Wallet",
    description: "Add naira",
    icon: Wallet
  },
  {
    href: "/investments",
    label: "Invest Now",
    description: "Start earning",
    icon: TrendingUp
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    description: "Track growth",
    icon: PieChart
  },
  {
    href: "/team",
    label: "Invite Friends",
    description: "Earn rewards",
    icon: Users
  },
  {
    href: "/withdrawals",
    label: "Request Withdrawal",
    description: "Withdraw funds",
    icon: ArrowUpRight
  }
] as const;

type Props = {
  nextHref?: string;
  className?: string;
};

/** Compact action strip — one highlighted primary from conversion state. */
export function DashboardQuickActions({ nextHref, className }: Props) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>
      {catalog.map(({ href, label, description, icon: Icon }) => {
        const primary = nextHref ? href === nextHref : href === "/deposits" || href === "/investments";
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex min-h-[var(--tap-min)] flex-col justify-center overflow-hidden rounded-[var(--radius)] border bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-sm)] card-lift",
              primary
                ? "border-[var(--emerald)]/35 bg-gradient-to-br from-[var(--emerald-soft)] to-[var(--surface-raised)]"
                : "border-[var(--border)] hover:border-[var(--emerald)]/25"
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-[var(--motion-base)] group-hover:scale-105",
                  primary ? "bg-[var(--emerald)]" : "bg-[var(--navy)]"
                )}
              >
                <Icon size={18} strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--heading)]">{label}</span>
                <span className="block text-xs text-[var(--text-muted)]">{description}</span>
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
