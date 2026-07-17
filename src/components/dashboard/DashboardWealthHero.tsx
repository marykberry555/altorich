"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { DashboardPayoutCountdown } from "@/components/dashboard/DashboardPayoutCountdown";
import { getGreeting } from "@/lib/utils/avatar";
import { getPackageLabel } from "@/lib/packages/constants";
import { formatNaira } from "@/lib/domain";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";
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
  primaryCta?: { href: string; label: string };
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
  primaryCta
}: Props) {
  const now = useLiveNow();
  const name = fullName.trim() || "Member";
  const sectorLabel = getPackageLabel(preferredPackageSlug);

  const aggregate = useMemo(
    () => aggregateLiveAccrual(toAccrualInputs(liveInputs), now),
    [liveInputs, now]
  );

  const isLive = aggregate.activeCount > 0;
  const todaysEarnings = isLive ? aggregate.totalTodayAccrual : 0;
  const liveAccrued = isLive ? aggregate.totalLive : totalEarned;
  const principal = isLive ? aggregate.totalPrincipal : totalInvested;
  const todayTick = toLiveRateTick(aggregate, now, todaysEarnings);
  const liveTick = toLiveRateTick(aggregate, now, liveAccrued);

  const cta =
    primaryCta ??
    (walletBalance > 0
      ? { href: "/investments", label: "Invest now" }
      : { href: "/deposits", label: "Fund wallet" });

  return (
    <Card variant="elevated" padding="none" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] opacity-[0.97]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--gold)]/10 blur-3xl" aria-hidden />

      <div className="relative p-5 text-white sm:p-7 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
            <div>
              <p className="text-sm font-medium text-white/70">{getGreeting()},</p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/90">
                My Investment
              </p>
            </div>
          </div>
          {isLive ? (
            <Link href={cta.href} className="hidden shrink-0 sm:block">
              <Button variant="gold" size="sm" className="gap-1.5">
                {cta.label}
                <ArrowRight size={14} aria-hidden />
              </Button>
            </Link>
          ) : null}
        </div>

        {isLive ? (
          <div
            className={cn(
              "relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6",
              aggregate.isAccruing && "animate-live-glow"
            )}
          >
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
              {aggregate.isAccruing ? <span className="live-dot" aria-hidden /> : null}
              Today&apos;s Earnings
            </p>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-[3.5rem]">
              <AnimatedEarningsCounter value={todaysEarnings} liveRate={todayTick} decimals={2} className="text-white" />
            </p>
            <p className="mt-2 text-sm text-white/70">
              Live accrued earnings{" "}
              <span className="font-semibold text-white">
                <AnimatedEarningsCounter value={liveAccrued} liveRate={liveTick} decimals={2} />
              </span>
            </p>
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Start earning</p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">₦0.00</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {walletBalance > 0
                ? "Your wallet is funded. Allocate to your preferred investment sector to begin."
                : "Fund your wallet, choose an investment sector, and earn every Monday."}
            </p>
            <div className="mt-5">
              <Link href={cta.href}>
                <Button variant="gold" size="md" className="gap-2">
                  {cta.label}
                  <ArrowRight size={16} aria-hidden />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-4">
          <DashboardPayoutCountdown active={hasActiveInvestment} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Principal</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(principal)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              Current Investment Sector
            </dt>
            <dd className="mt-1 truncate text-lg font-bold sm:text-xl">{sectorLabel}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              {PLATFORM_EARNING.modelName}
            </dt>
            <dd className="mt-1 text-lg font-bold sm:text-xl">Up to {PLATFORM_EARNING.dailyReturnPercent}% daily</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Withdrawable Balance</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm lg:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              {PLATFORM_EARNING.nextSettlementLabel}
            </dt>
            <dd className="mt-1 text-sm font-medium text-white/90">{PLATFORM_EARNING.payoutTiming}</dd>
          </div>
        </dl>

        {isLive ? (
          <div className="mt-5 sm:hidden">
            <Link href={cta.href} className="block">
              <Button variant="gold" size="md" className="w-full gap-2">
                {cta.label}
                <ArrowRight size={16} aria-hidden />
              </Button>
            </Link>
          </div>
        ) : null}
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
  portfolioValue: _portfolioValue,
  totalInvested,
  totalEarned,
  primaryCta
}: Omit<Props, "liveInputs"> & { portfolioValue: number }) {
  const name = fullName.trim() || "Member";
  const sectorLabel = getPackageLabel(preferredPackageSlug);
  const cta =
    primaryCta ??
    (walletBalance > 0
      ? { href: "/investments", label: "Invest now" }
      : { href: "/deposits", label: "Fund wallet" });

  return (
    <Card variant="elevated" padding="none" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] opacity-[0.97]" aria-hidden />
      <div className="relative p-5 text-white sm:p-7 lg:p-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
          <div>
            <p className="text-sm font-medium text-white/70">{getGreeting()},</p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/90">
              My Investment
            </p>
          </div>
        </div>

        {hasActiveInvestment ? (
          <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Live Accrued Earnings</p>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{formatNaira(totalEarned)}</p>
            <p className="mt-2 text-sm text-white/70">Updates after each settlement cycle.</p>
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Start earning</p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">₦0.00</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {walletBalance > 0
                ? "Your wallet is funded. Allocate to your preferred investment sector to begin."
                : "Fund your wallet, choose an investment sector, and earn every Monday."}
            </p>
            <div className="mt-5">
              <Link href={cta.href}>
                <Button variant="gold" size="md" className="gap-2">
                  {cta.label}
                  <ArrowRight size={16} aria-hidden />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-4">
          <DashboardPayoutCountdown active={hasActiveInvestment} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Principal</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalInvested)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              Current Investment Sector
            </dt>
            <dd className="mt-1 truncate text-lg font-bold sm:text-xl">{sectorLabel}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              {PLATFORM_EARNING.modelName}
            </dt>
            <dd className="mt-1 text-lg font-bold sm:text-xl">Up to {PLATFORM_EARNING.dailyReturnPercent}% daily</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Withdrawable Balance</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 lg:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
              {PLATFORM_EARNING.nextSettlementLabel}
            </dt>
            <dd className="mt-1 text-sm font-medium text-white/90">{PLATFORM_EARNING.payoutTiming}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
