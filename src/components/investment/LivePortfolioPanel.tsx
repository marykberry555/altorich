"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Wallet } from "lucide-react";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import { aggregateLiveAccrual, formatCountdownHms, toLiveRateTick, type LiveAccrualInput } from "@/lib/investment-accrual-live";
import type { SettlementFrequency } from "@/lib/investment";
import { formatNaira } from "@/lib/domain";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type LiveInvestmentInput = {
  id: string;
  status: string;
  amount: number;
  totalEarned: number;
  projectedDaily: number;
  weeklyRoiBps?: number;
  settlementFrequency: SettlementFrequency;
  startedAt: string;
  endsAt: string;
  lastSettlementAt?: string | null;
  lastWeeklySettlementAt?: string | null;
};

type Props = {
  walletBalance: number;
  investments: LiveInvestmentInput[];
};

export function LivePortfolioPanel({ walletBalance, investments }: Props) {
  const now = useLiveNow();

  const aggregate = useMemo(() => {
    const inputs: LiveAccrualInput[] = investments
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
    return aggregateLiveAccrual(inputs, now);
  }, [investments, now]);

  const portfolioTick = toLiveRateTick(aggregate, now, aggregate.portfolioValue);
  const earningsTick = toLiveRateTick(aggregate, now, aggregate.totalLive);
  const todayTick = toLiveRateTick(aggregate, now, aggregate.totalTodayAccrual);

  return (
    <Card variant="elevated" className="overflow-hidden bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Live portfolio</p>
          <p className="mt-2 text-3xl font-bold tabular-nums sm:text-4xl">
            <AnimatedEarningsCounter value={aggregate.portfolioValue} liveRate={portfolioTick} className="text-white" />
          </p>
          <p className="mt-1 text-sm text-white/80">
            {aggregate.activeCount} active · {aggregate.isAccruing ? `Next credit ${formatCountdownHms(aggregate.nextAccrualInMs)}` : "Awaiting next cycle"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/investments">
            <Button variant="gold" size="sm">
              Invest now
            </Button>
          </Link>
          <Link href="/portfolio">
            <Button variant="outline" size="sm" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              Portfolio
            </Button>
          </Link>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-white/70">
            <Wallet size={12} aria-hidden /> Available wallet
          </dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{formatNaira(walletBalance)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <dt className="flex items-center gap-1.5 text-xs text-white/70">
            <TrendingUp size={12} aria-hidden /> Total invested
          </dt>
          <dd className="mt-1 text-lg font-bold tabular-nums">{formatNaira(aggregate.totalPrincipal)}</dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <dt className="text-xs text-white/70">Today&apos;s earnings</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">
            <AnimatedEarningsCounter value={aggregate.totalTodayAccrual} liveRate={todayTick} />
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <dt className="text-xs text-white/70">Total earnings</dt>
          <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">
            <AnimatedEarningsCounter value={aggregate.totalLive} liveRate={earningsTick} />
          </dd>
        </div>
      </dl>

      {aggregate.isAccruing ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/70">
            <span>Accrual progress (current period)</span>
            <span className="tabular-nums">{formatNaira(aggregate.totalTodayAccrual)} / {formatNaira(aggregate.totalPeriodTarget)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-1000 ease-linear"
              style={{
                width: `${aggregate.totalPeriodTarget > 0 ? Math.min(100, (aggregate.totalTodayAccrual / aggregate.totalPeriodTarget) * 100) : 0}%`
              }}
            />
          </div>
        </div>
      ) : null}

      <Link href="/portfolio" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white">
        View full portfolio <ArrowRight size={12} />
      </Link>
    </Card>
  );
}
