"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import { aggregateLiveAccrual, formatCountdownHms, type LiveAccrualInput } from "@/lib/investment-accrual-live";
import type { LiveInvestmentInput } from "@/components/investment/LivePortfolioPanel";
import type { ActiveInvestmentRow } from "@/components/investment/ActiveInvestmentCard";
import type { ChartPoint } from "@/lib/dashboard/chart-data";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { ChartEmptyPlaceholder } from "@/components/dashboard/ChartEmptyPlaceholder";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/design-system";
import { formatNaira, NAIRA_SYMBOL } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Props = {
  liveInputs: LiveInvestmentInput[];
  rows: ActiveInvestmentRow[];
  earningsTrend: ChartPoint[];
  totalInvested: number;
  totalEarned: number;
  className?: string;
};

function toAccrualInputs(inputs: LiveInvestmentInput[]): LiveAccrualInput[] {
  return inputs
    .filter((i) => i.status === "active")
    .map((i) => ({
      status: i.status,
      principalAmount: i.amount,
      creditedTotal: i.totalEarned,
      projectedDaily: i.projectedDaily,
      settlementFrequency: i.settlementFrequency,
      startedAt: i.startedAt,
      endsAt: i.endsAt,
      lastSettlementAt: i.lastSettlementAt
    }));
}

function computeAverageReturn(rows: ActiveInvestmentRow[]): number {
  const active = rows.filter((r) => r.status === "active" && r.amount > 0);
  if (active.length === 0) return 0;
  const totalPrincipal = active.reduce((s, r) => s + r.amount, 0);
  const weighted = active.reduce((s, r) => s + (r.projectedDaily / r.amount) * 100 * r.amount, 0);
  return weighted / totalPrincipal;
}

export function DashboardPortfolioSection({
  liveInputs,
  rows,
  earningsTrend,
  totalInvested,
  totalEarned,
  className
}: Props) {
  const now = useLiveNow();
  const hasInvestments = rows.some((r) => r.status === "active" || r.status === "completed" || r.status === "matured");

  const aggregate = useMemo(
    () => aggregateLiveAccrual(toAccrualInputs(liveInputs), now),
    [liveInputs, now]
  );

  const portfolioValue = aggregate.activeCount > 0 ? aggregate.portfolioValue : totalInvested + totalEarned;
  const avgReturn = computeAverageReturn(rows);
  const liveTotalEarnings = aggregate.activeCount > 0 ? aggregate.totalLive : totalEarned;
  const hasChartData = earningsTrend.length > 0;

  if (!hasInvestments) {
    return (
      <section className={className}>
        <SectionHeading title="My Portfolio" description="Your investments, returns, and performance in one place." />
        <Card variant="elevated" className="overflow-hidden">
          <div className="flex flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--emerald-soft)]/80 to-[var(--gray-100)] ring-1 ring-[var(--border)]">
              <CalendarClock className="h-7 w-7 text-[var(--emerald)]" strokeWidth={1.5} aria-hidden />
            </div>
            <h3 className="text-xl font-semibold text-[var(--heading)]">No active investments yet.</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
              Begin your investment journey by funding your wallet and selecting a package.
            </p>
            <Link href="/investments" className="mt-6">
              <Button variant="gold" size="md" className="gap-2">
                Invest Now
                <ArrowRight size={16} aria-hidden />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading title="My Portfolio" description="Portfolio value, returns, and settlement outlook." className="mb-0" />
        <Link href="/portfolio" className="text-sm font-semibold text-[var(--emerald)] transition hover:text-[var(--emerald-mid)]">
          Open portfolio →
        </Link>
      </div>

      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-[var(--emerald)] via-[var(--navy-mid)] to-[var(--gold)]" aria-hidden />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Portfolio value</p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[var(--heading)] sm:text-4xl">
                <AnimatedEarningsCounter value={portfolioValue} />
              </p>
            </div>
            {aggregate.isAccruing ? (
              <p className="rounded-full bg-[var(--emerald-soft)]/50 px-3 py-1 text-xs font-semibold text-[var(--emerald)]">
                Next settlement · {formatCountdownHms(aggregate.nextAccrualInMs)}
              </p>
            ) : null}
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Active investments", value: String(aggregate.activeCount) },
              { label: "Average return", value: `${avgReturn.toFixed(2)}% daily` },
              { label: "Total earnings", value: formatNaira(liveTotalEarnings) },
              {
                label: "Next settlement",
                value: aggregate.isAccruing ? formatCountdownHms(aggregate.nextAccrualInMs) : "—"
              }
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--gray-50)]/50 px-4 py-3">
                <dt className="text-xs font-medium text-[var(--text-muted)]">{item.label}</dt>
                <dd className={cn("mt-1 text-lg font-bold tabular-nums text-[var(--heading)]", item.label === "Total earnings" && "text-[var(--emerald)]")}>
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          {aggregate.isAccruing ? (
            <div className="mt-6">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Current period progress</span>
                <span className="tabular-nums">
                  {formatNaira(aggregate.totalTodayAccrual)} / {formatNaira(aggregate.totalPeriodTarget)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--emerald)] to-[var(--emerald-light)] transition-[width] duration-1000 ease-linear"
                  style={{
                    width: `${aggregate.totalPeriodTarget > 0 ? Math.min(100, (aggregate.totalTodayAccrual / aggregate.totalPeriodTarget) * 100) : 0}%`
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <p className="mb-4 text-sm font-semibold text-[var(--heading)]">Performance</p>
            <div className="h-52">
              {!hasChartData ? (
                <ChartEmptyPlaceholder />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsTrend}>
                    <defs>
                      <linearGradient id="portfolioPerfFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#047857" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-subtle)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--text-subtle)" tickFormatter={(v) => `${NAIRA_SYMBOL}${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatNaira(Number(v ?? 0))} />
                    <Area type="monotone" dataKey="value" stroke="#047857" fill="url(#portfolioPerfFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
