"use client";

import { useMemo } from "react";
import type { ActiveInvestmentRow } from "@/components/investment/ActiveInvestmentCard";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import {
  calculateLiveAccrualState,
  formatCountdownHms,
  type LiveAccrualInput
} from "@/lib/investment-accrual-live";
import { formatNaira } from "@/lib/domain";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { Card } from "@/components/ui/Card";

type Props = {
  row: ActiveInvestmentRow;
};

export function InvestmentAccrualPanel({ row }: Props) {
  const now = useLiveNow();

  const input: LiveAccrualInput = useMemo(
    () => ({
      status: row.status,
      principalAmount: row.amount,
      creditedTotal: row.totalEarned,
      projectedDaily: row.projectedDaily,
      settlementFrequency: row.settlementFrequency,
      startedAt: row.startedAt,
      endsAt: row.endsAt,
      lastSettlementAt: row.lastSettlementAt
    }),
    [row]
  );

  const state = useMemo(() => calculateLiveAccrualState(input, now), [input, now]);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="bg-gradient-to-r from-[var(--emerald)]/10 to-transparent px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--emerald)]">Live performance</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{row.planName}</p>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Current value</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--heading)]">
            <AnimatedEarningsCounter value={row.amount + state.liveTotal} />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Live earnings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">
            <AnimatedEarningsCounter value={state.liveTotal} />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Today&apos;s accrual</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--emerald)]">
            {formatNaira(state.todayAccrual)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Credited to date</p>
          <p className="mt-1 font-semibold tabular-nums">{formatNaira(state.creditedTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Next settlement</p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
            {state.isAccruing ? formatCountdownHms(state.nextAccrualInMs) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Period target</p>
          <p className="mt-1 font-semibold tabular-nums">{formatNaira(state.periodEarnings)}</p>
        </div>
      </div>
      {state.isAccruing ? (
        <div className="border-t border-[var(--border)] px-5 py-4">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Current period progress</span>
            <span>{state.dayProgressPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
            <div
              className="h-full rounded-full bg-[var(--emerald)] transition-[width] duration-1000 ease-linear"
              style={{ width: `${state.dayProgressPercent}%` }}
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}
