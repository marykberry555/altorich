"use client";

import type { VipLevelConfig } from "@/lib/referral/types";
import { computeProgressToTarget } from "@/lib/referral/vip-display";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  currentLevel: number;
  currentLabel: string;
  currentCommission: number;
  verifiedCount: number;
  nextTier: VipLevelConfig | null;
  className?: string;
};

export function VipProgressPanel({
  currentLabel,
  currentCommission,
  verifiedCount,
  nextTier,
  className
}: Props) {
  const progress = nextTier
    ? computeProgressToTarget(verifiedCount, nextTier.min_members)
    : { progressPct: 100, remaining: 0, target: verifiedCount, label: `${verifiedCount} Verified Investors` };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--emerald-soft)]/40 to-transparent px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Your progress</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Current level</p>
            <p className="text-xl font-bold text-[var(--heading)]">{currentLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-muted)]">Current commission</p>
            <p className="text-xl font-bold tabular-nums text-[var(--emerald)]">{currentCommission}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[var(--text-muted)]">Verified investors</dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--heading)]">{verifiedCount}</dd>
          </div>
          {nextTier ? (
            <>
              <div>
                <dt className="text-[var(--text-muted)]">Investors remaining</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-[var(--heading)]">{progress.remaining}</dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[var(--text-muted)]">Next level</dt>
                <dd className="mt-0.5 font-semibold text-[var(--heading)]">{nextTier.label}</dd>
              </div>
            </>
          ) : (
            <div className="col-span-2">
              <dt className="text-[var(--text-muted)]">Status</dt>
              <dd className="mt-0.5 font-semibold text-[var(--emerald)]">Highest tier unlocked</dd>
            </div>
          )}
        </dl>

        {nextTier ? (
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
              <span>{progress.label}</span>
              <span className="tabular-nums text-[var(--heading)]">{progress.progressPct}% Complete</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--gray-100)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--emerald)] to-[var(--emerald-light)] transition-all duration-700"
                style={{ width: `${progress.progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-subtle)]">
              Unlock {nextTier.label} for {nextTier.commission_percent}% commission
              {nextTier.milestone_bonus > 0 ? " and a milestone bonus" : ""}.
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
