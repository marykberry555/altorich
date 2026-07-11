"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import {
  calculateLiveAccrualState,
  formatCountdownHms,
  type LiveAccrualInput
} from "@/lib/investment-accrual-live";
import type { SettlementFrequency } from "@/lib/investment";
import { formatNaira } from "@/lib/domain";
import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { StatusBadge } from "@/components/design-system";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type ActiveInvestmentRow = {
  id: string;
  reference: string | null;
  planName: string;
  amount: number;
  totalEarned: number;
  status: string;
  startedAt: string;
  endsAt: string;
  projectedDaily: number;
  weeklyRoiBps?: number;
  settlementFrequency: SettlementFrequency;
  lastSettlementAt?: string | null;
  lastWeeklySettlementAt?: string | null;
};

function toAccrualInput(row: ActiveInvestmentRow): LiveAccrualInput {
  return {
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
  };
}

function progressPercent(startedAt: string, endsAt: string, now: Date) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endsAt).getTime();
  if (end <= start) return 0;
  return Math.min(100, Math.max(0, ((now.getTime() - start) / (end - start)) * 100));
}

type CardProps = {
  row: ActiveInvestmentRow;
  compact?: boolean;
};

export function ActiveInvestmentCard({ row, compact }: CardProps) {
  const now = useLiveNow();
  const state = useMemo(() => calculateLiveAccrualState(toAccrualInput(row), now), [row, now]);
  const progress = progressPercent(row.startedAt, row.endsAt, now);

  return (
    <Link href={`/investments/${row.id}`} className="block">
      <Card
        variant="elevated"
        className={cn(
          "transition-all hover:border-[var(--emerald)]/30 hover:shadow-[var(--shadow-md)]",
          compact ? "p-4" : "p-5"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--heading)]">{row.planName}</p>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-subtle)]">{row.reference ?? row.id.slice(0, 8)}</p>
          </div>
          <StatusBadge status={row.status} />
        </div>

        <dl className={cn("mt-4 grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-3")}>
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Invested</dt>
            <dd className="mt-0.5 font-semibold tabular-nums">{formatNaira(row.amount)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Current value</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-[var(--emerald)]">
              <AnimatedEarningsCounter value={row.amount + state.liveTotal} />
            </dd>
          </div>
          {!compact ? (
            <div>
              <dt className="text-xs text-[var(--text-subtle)]">Total earnings</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-[var(--emerald)]">
                <AnimatedEarningsCounter value={state.liveTotal} />
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>Cycle progress</span>
            <span className="tabular-nums">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
            <div
              className="h-full rounded-full bg-[var(--emerald)] transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          {state.isAccruing ? (
            <p className="text-xs text-[var(--text-subtle)]">
              Next settlement in {formatCountdownHms(state.nextAccrualInMs)}
            </p>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

type ListProps = {
  investments: ActiveInvestmentRow[];
  title?: string;
};

export function ActiveInvestmentsList({ investments, title = "Active investments" }: ListProps) {
  const active = investments.filter((i) => ["active", "stopping"].includes(i.status));

  if (active.length === 0) {
    return (
      <Card variant="elevated" padding="lg" className="text-center">
        <p className="font-semibold text-[var(--heading)]">No active investments</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Fund your wallet and select a package to get started.</p>
        <Link href="/investments" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--emerald)]">
          Browse packages <ArrowRight size={14} />
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {active.map((row) => (
          <ActiveInvestmentCard key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
