"use client";

import { useMemo } from "react";
import type { ActiveInvestmentRow } from "@/components/investment/ActiveInvestmentCard";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import {
  calculateLiveAccrualState,
  formatCountdownHms,
  toLiveAccrualTick,
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
      weeklyRoiBps: row.weeklyRoiBps,
      settlementFrequency: row.settlementFrequency,
      startedAt: row.startedAt,
      endsAt: row.endsAt,
      lastSettlementAt: row.lastSettlementAt,
      lastWeeklySettlementAt: row.lastWeeklySettlementAt
    }),
    [row]
  );

  const state = useMemo(() => calculateLiveAccrualState(input, now), [input, now]);
  const earningsTick = toLiveAccrualTick(state);
  const valueTick = toLiveAccrualTick(state, row.amount);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] px-5 py-6 text-white sm:px-8 sm:py-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Live interest accrual</p>
        <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
          <AnimatedEarningsCounter
            value={state.liveTotal}
            liveAccrual={earningsTick}
            className="text-emerald-200"
          />
        </p>
        <p className="mt-2 text-sm text-white/75">{row.planName}</p>

        <div className="mt-8 border-t border-white/15 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Settlement countdown</p>
          <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
            {state.isAccruing ? formatCountdownHms(state.nextAccrualInMs) : "—"}
          </p>
          {state.nextSettlementAt ? (
            <p className="mt-2 text-xs text-white/65">
              Next settlement · {state.nextSettlementAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Current accrued earnings</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--emerald)]">
            <AnimatedEarningsCounter value={state.liveTotal} liveAccrual={earningsTick} />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Current investment value</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[var(--heading)]">
            <AnimatedEarningsCounter value={state.currentValue} liveAccrual={valueTick} />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Estimated next settlement</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{formatNaira(state.estimatedNextSettlement)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-subtle)]">Credited to date</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{formatNaira(state.creditedTotal)}</p>
        </div>
      </div>

      {state.isAccruing ? (
        <div className="border-t border-[var(--border)] px-5 py-4">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Accrual progress this period</span>
            <span>{state.dayProgressPercent.toFixed(1)}%</span>
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
