"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { MetricStatCard } from "@/components/design-system";
import { getGreeting } from "@/lib/utils/avatar";
import { getPackageLabel } from "@/lib/packages/constants";
import { formatNaira } from "@/lib/domain";
import { aggregateLiveAccrual, type LiveAccrualInput } from "@/lib/investment-accrual-live";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import type { LiveInvestmentInput } from "@/components/investment/LivePortfolioPanel";
import { Card } from "@/components/ui/Card";
import {
  ArrowDownLeft,
  Clock,
  Layers,
  TrendingUp,
  Wallet
} from "lucide-react";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  preferredPackageSlug?: string | null;
  hasActiveInvestment: boolean;
  walletBalance: number;
  liveInputs: LiveInvestmentInput[];
  totalInvested: number;
  totalEarned: number;
  pendingPayouts: number;
};

function toAccrualInputs(inputs: LiveInvestmentInput[]): LiveAccrualInput[] {
  return inputs
    .filter((i) => i.status === "active" || i.status === "stopping")
    .map((i) => ({
      status: i.status,
      principalAmount: i.amount,
      creditedTotal: i.totalEarned,
      projectedDaily: i.projectedDaily,
      weeklyRoiBps: i.weeklyRoiBps,
      settlementFrequency: i.settlementFrequency,
      startedAt: i.startedAt,
      endsAt: i.endsAt,
      lastSettlementAt: i.lastSettlementAt,
      lastWeeklySettlementAt: i.lastWeeklySettlementAt
    }));
}

export function DashboardWealthHero({
  fullName,
  avatarUrl,
  preferredPackageSlug,
  hasActiveInvestment,
  walletBalance,
  liveInputs,
  totalInvested,
  totalEarned,
  pendingPayouts
}: Props) {
  const now = useLiveNow();
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);

  const aggregate = useMemo(
    () => aggregateLiveAccrual(toAccrualInputs(liveInputs), now),
    [liveInputs, now]
  );

  const portfolioValue = aggregate.activeCount > 0 ? aggregate.portfolioValue : totalInvested + totalEarned;
  const todayEarnings = aggregate.totalTodayAccrual;
  const liveTotalEarnings = aggregate.activeCount > 0 ? aggregate.totalLive : totalEarned;

  return (
    <>
      <Card variant="elevated" padding="none" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] opacity-[0.97]"
          aria-hidden
        />
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[var(--emerald-light)]/20 blur-3xl" aria-hidden />

        <div className="relative p-6 text-white sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
              <div>
                <p className="text-sm font-medium text-white/70">{getGreeting()}</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
                <p className="mt-1.5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-semibold text-white/90">
                  {hasActiveInvestment ? "Active" : "Preferred"} · {packageLabel}
                </p>
              </div>
            </div>

            <div className="lg:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Portfolio value</p>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <AnimatedEarningsCounter value={portfolioValue} className="text-white" />
              </p>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-white/65">
                <Wallet size={13} aria-hidden /> Wallet balance
              </dt>
              <dd className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{formatNaira(walletBalance)}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <dt className="text-xs font-medium text-white/65">Today&apos;s earnings</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-emerald-200 sm:text-2xl">
                <AnimatedEarningsCounter value={todayEarnings} />
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricStatCard title="Wallet balance" value={formatNaira(walletBalance)} icon={<Wallet />} href="/wallet" accent="emerald" actionLabel="Open wallet" />
        <MetricStatCard
          title="Portfolio value"
          value={formatNaira(portfolioValue)}
          icon={<TrendingUp />}
          href="/portfolio"
          accent="navy"
          actionLabel="Open portfolio"
        />
        <MetricStatCard
          title="Total invested"
          value={formatNaira(aggregate.activeCount > 0 ? aggregate.totalPrincipal : totalInvested)}
          icon={<Layers />}
          href="/portfolio"
          accent="sky"
          actionLabel="View holdings"
        />
        <MetricStatCard
          title="Live earnings"
          value={formatNaira(liveTotalEarnings)}
          icon={<ArrowDownLeft />}
          href="/portfolio"
          accent="gold"
          actionLabel="View earnings"
        />
      </div>
    </>
  );
}

export function DashboardWealthHeroStatic({
  fullName,
  avatarUrl,
  preferredPackageSlug,
  hasActiveInvestment,
  walletBalance,
  portfolioValue,
  totalInvested,
  totalEarned,
  pendingPayouts,
  metricsOnly = false
}: Omit<Props, "liveInputs"> & {
  portfolioValue: number;
  metricsOnly?: boolean;
}) {
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);

  const metrics = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricStatCard title="Wallet balance" value={formatNaira(walletBalance)} icon={<Wallet />} href="/wallet" accent="emerald" actionLabel="Open wallet" />
      <MetricStatCard title="Portfolio value" value={formatNaira(portfolioValue)} icon={<TrendingUp />} href="/portfolio" accent="navy" actionLabel="Open portfolio" />
      <MetricStatCard title="Total invested" value={formatNaira(totalInvested)} icon={<Layers />} href="/portfolio" accent="sky" actionLabel="View holdings" />
      <MetricStatCard title="Total earnings" value={formatNaira(totalEarned)} icon={<ArrowDownLeft />} href="/portfolio" accent="gold" actionLabel="View earnings" />
      <MetricStatCard title="Pending payouts" value={String(pendingPayouts)} icon={<Clock />} href="/withdrawals" accent="amber" actionLabel="Payout status" />
    </div>
  );

  if (metricsOnly) return metrics;

  return (
    <>
      <Card variant="elevated" padding="none" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] opacity-[0.97]" aria-hidden />
        <div className="relative p-6 text-white sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
              <div>
                <p className="text-sm font-medium text-white/70">{getGreeting()}</p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
                <p className="mt-1.5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs font-semibold text-white/90">
                  {hasActiveInvestment ? "Active" : "Preferred"} · {packageLabel}
                </p>
              </div>
            </div>
            <div className="lg:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Portfolio value</p>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{formatNaira(portfolioValue)}</p>
            </div>
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="text-xs font-medium text-white/65">Wallet balance</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{formatNaira(walletBalance)}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="text-xs font-medium text-white/65">Total earnings</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-emerald-200 sm:text-2xl">{formatNaira(totalEarned)}</dd>
            </div>
          </dl>
        </div>
      </Card>
      {metrics}
    </>
  );
}
