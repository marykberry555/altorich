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
  const packageLabel = getPackageLabel(preferredPackageSlug);

  const aggregate = useMemo(
    () => aggregateLiveAccrual(toAccrualInputs(liveInputs), now),
    [liveInputs, now]
  );

  const isLive = aggregate.activeCount > 0;
  /** Current settlement-period earnings (weekly window) — money hero. */
  const earnedThisWeek = isLive ? aggregate.totalTodayAccrual : 0;
  const liveLifetime = isLive ? aggregate.totalLive : totalEarned;
  const portfolioValue = isLive ? aggregate.portfolioValue : totalInvested + totalEarned;
  const totalPrincipal = isLive ? aggregate.totalPrincipal : totalInvested;

  const weekTick = toLiveRateTick(aggregate, now, earnedThisWeek);
  const lifetimeTick = toLiveRateTick(aggregate, now, liveLifetime);

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
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[var(--emerald-light)]/20 blur-3xl" aria-hidden />

      <div className="relative p-5 text-white sm:p-7 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" className="ring-2 ring-white/20" />
            <div>
              <p className="text-sm font-medium text-white/70">{getGreeting()},</p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{name}</h1>
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
                {isLive ? <span className="live-dot" aria-hidden /> : null}
                {hasActiveInvestment ? "Active" : "Preferred"} · {packageLabel}
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
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/10 via-transparent to-transparent" aria-hidden />
            <div className="relative">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
                {aggregate.isAccruing ? <span className="live-dot" aria-hidden /> : null}
                Earned this week
              </p>
              <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl lg:text-[3.5rem]">
                <AnimatedEarningsCounter
                  value={earnedThisWeek}
                  liveRate={weekTick}
                  decimals={2}
                  className="text-white"
                />
              </p>
              <p className="mt-2 text-sm text-white/70">
                Lifetime earnings{" "}
                <span className="font-semibold text-white">
                  <AnimatedEarningsCounter value={liveLifetime} liveRate={lifetimeTick} decimals={2} />
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Start earning</p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">₦0.00</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {walletBalance > 0
                ? "Your wallet is funded. Activate a package to watch earnings grow."
                : "Fund your wallet, pick a package, and earn every Monday."}
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

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Wallet</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Invested</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalPrincipal)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Package</dt>
            <dd className="mt-1 truncate text-lg font-bold sm:text-xl">{packageLabel}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Portfolio</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(portfolioValue)}</dd>
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
  portfolioValue,
  totalInvested,
  totalEarned,
  primaryCta
}: Omit<Props, "liveInputs"> & { portfolioValue: number }) {
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);
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
            <p className="mt-1 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
              {hasActiveInvestment ? "Active" : "Preferred"} · {packageLabel}
            </p>
          </div>
        </div>

        {hasActiveInvestment ? (
          <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Earned this week</p>
            <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{formatNaira(totalEarned)}</p>
            <p className="mt-2 text-sm text-white/70">Lifetime earnings update after settlement.</p>
          </div>
        ) : (
          <div className="relative mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm sm:mt-7 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Start earning</p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">₦0.00</p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {walletBalance > 0
                ? "Your wallet is funded. Activate a package to watch earnings grow."
                : "Fund your wallet, pick a package, and earn every Monday."}
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

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Wallet</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(walletBalance)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Invested</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(totalInvested)}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Package</dt>
            <dd className="mt-1 truncate text-lg font-bold sm:text-xl">{packageLabel}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Portfolio</dt>
            <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{formatNaira(portfolioValue)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
