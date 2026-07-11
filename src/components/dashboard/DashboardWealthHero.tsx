"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { DashboardPayoutCountdown } from "@/components/dashboard/DashboardPayoutCountdown";
import { getGreeting } from "@/lib/utils/avatar";
import { getPackageLabel } from "@/lib/packages/constants";
import { formatNaira } from "@/lib/domain";
import { aggregateLiveAccrual, toLiveRateTick, type LiveAccrualInput } from "@/lib/investment-accrual-live";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import type { LiveInvestmentInput } from "@/components/investment/LivePortfolioPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  preferredPackageSlug?: string | null;
  hasActiveInvestment: boolean;
  walletBalance: number;
  liveInputs: LiveInvestmentInput[];
  totalInvested: number;
  totalEarned: number;
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
  totalEarned
}: Props) {
  const now = useLiveNow();
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);

  const aggregate = useMemo(
    () => aggregateLiveAccrual(toAccrualInputs(liveInputs), now),
    [liveInputs, now]
  );

  const isLive = aggregate.activeCount > 0;
  const liveAccruedEarnings = isLive ? aggregate.totalLive : totalEarned;
  const todayGrowth = isLive ? aggregate.totalTodayAccrual : 0;
  const portfolioValue = isLive ? aggregate.portfolioValue : totalInvested + totalEarned;
  const totalPrincipal = isLive ? aggregate.totalPrincipal : totalInvested;

  const earningsTick = toLiveRateTick(aggregate, now, liveAccruedEarnings);
  const todayTick = toLiveRateTick(aggregate, now, todayGrowth);

  return (
    <Card variant="elevated" padding="none" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] opacity-[0.97]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[var(--emerald-light)]/20 blur-3xl" aria-hidden />

      <div className="relative p-5 text-white sm:p-7 lg:p-8">
        {/* Greeting */}
        <div className="flex items-center gap-3 sm:gap-4">
          <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
          <div>
            <p className="text-sm font-medium text-white/70">{getGreeting()},</p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
            <p className="mt-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
              {hasActiveInvestment ? "Active" : "Preferred"} · {packageLabel}
            </p>
          </div>
        </div>

        {/* Live accrued earnings — focal point */}
        <div
          className={cn(
            "relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6",
            isLive && aggregate.isAccruing && "animate-[pulse-soft_3s_ease-in-out_infinite]"
          )}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 via-transparent to-transparent" aria-hidden />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Live accrued earnings</p>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-[3.25rem]">
              <AnimatedEarningsCounter
                value={liveAccruedEarnings}
                liveRate={isLive ? earningsTick : undefined}
                decimals={2}
                showRatePerSecond={isLive && aggregate.isAccruing}
                className="text-white"
              />
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-white/70">
                Today&apos;s growth{" "}
                <span className="font-semibold tabular-nums text-emerald-200">
                  {isLive ? (
                    <AnimatedEarningsCounter value={todayGrowth} liveRate={todayTick} decimals={2} />
                  ) : (
                    formatNaira(0)
                  )}
                </span>
              </span>
              {isLive && aggregate.isAccruing ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                  <TrendingUp size={12} aria-hidden />
                  Accruing live
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Payout countdown */}
        <div className="mt-4">
          <DashboardPayoutCountdown active={hasActiveInvestment} />
        </div>

        {/* Empty state CTA */}
        {!hasActiveInvestment ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-4 sm:px-5">
            <p className="text-sm text-white/80">Start your first investment to begin earning.</p>
            <Link href="/investments" className="mt-3 inline-block">
              <Button variant="gold" size="sm">
                Invest Now
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Secondary metrics — investor priority order */}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Wallet balance</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Portfolio value</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(portfolioValue)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Total invested</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalPrincipal)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Today&apos;s earnings</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200 sm:text-xl">
              {isLive ? (
                <AnimatedEarningsCounter value={todayGrowth} liveRate={todayTick} decimals={2} />
              ) : (
                formatNaira(0)
              )}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
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
  totalEarned
}: Omit<Props, "liveInputs"> & { portfolioValue: number }) {
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);

  return (
    <Card variant="elevated" padding="none" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] opacity-[0.97]" aria-hidden />
      <div className="relative p-5 text-white sm:p-7 lg:p-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
          <div>
            <p className="text-sm font-medium text-white/70">{getGreeting()},</p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
            <p className="mt-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
              {hasActiveInvestment ? "Active" : "Preferred"} · {packageLabel}
            </p>
          </div>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Live accrued earnings</p>
          <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{formatNaira(totalEarned)}</p>
        </div>

        <div className="mt-4">
          <DashboardPayoutCountdown active={hasActiveInvestment} />
        </div>

        {!hasActiveInvestment ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-4 sm:px-5">
            <p className="text-sm text-white/80">Start your first investment to begin earning.</p>
            <Link href="/investments" className="mt-3 inline-block">
              <Button variant="gold" size="sm">
                Invest Now
              </Button>
            </Link>
          </div>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Wallet balance</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Portfolio value</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(portfolioValue)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Total invested</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalInvested)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Today&apos;s earnings</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200 sm:text-xl">{formatNaira(0)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
