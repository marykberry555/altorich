"use client";

import { useMemo } from "react";
import Link from "next/link";
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

        {/* Primary focal — live earnings or onboarding */}
        {isLive ? (
          <div
            className={cn(
              "relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6",
              aggregate.isAccruing && "animate-[pulse-soft_3s_ease-in-out_infinite]"
            )}
          >
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 via-transparent to-transparent" aria-hidden />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Live accrued earnings</p>
              <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <AnimatedEarningsCounter
                  value={liveAccruedEarnings}
                  liveRate={earningsTick}
                  decimals={2}
                  className="text-white"
                />
              </p>
            </div>
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Ready to start earning?</p>
            <p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">Your investment journey starts here</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {walletBalance > 0
                ? "Your wallet is ready. Choose an investment package and begin earning after activation."
                : "Fund your wallet, choose a package, and begin earning immediately after activation."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/deposits">
                <Button variant="gold" size="sm">
                  Fund wallet
                </Button>
              </Link>
              <Link href="/investments">
                <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Explore packages
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Payout countdown */}
        <div className="mt-4">
          <DashboardPayoutCountdown active={hasActiveInvestment} />
        </div>

        {/* Secondary metrics */}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Wallet balance</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Today&apos;s earnings</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200 sm:text-xl">
              {isLive ? (
                <AnimatedEarningsCounter value={todayGrowth} liveRate={todayTick} decimals={2} />
              ) : (
                <span className="text-white/50">After activation</span>
              )}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Total invested</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalPrincipal)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Portfolio value</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(portfolioValue)}</dd>
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

        {hasActiveInvestment ? (
          <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Live accrued earnings</p>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{formatNaira(totalEarned)}</p>
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Ready to start earning?</p>
            <p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">Your investment journey starts here</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {walletBalance > 0
                ? "Your wallet is ready. Choose an investment package and begin earning after activation."
                : "Fund your wallet, choose a package, and begin earning immediately after activation."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/deposits">
                <Button variant="gold" size="sm">
                  Fund wallet
                </Button>
              </Link>
              <Link href="/investments">
                <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  Explore packages
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-4">
          <DashboardPayoutCountdown active={hasActiveInvestment} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Wallet balance</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Today&apos;s earnings</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200 sm:text-xl">
              {hasActiveInvestment ? formatNaira(0) : <span className="text-white/50">After activation</span>}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Total invested</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalInvested)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Portfolio value</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(portfolioValue)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
