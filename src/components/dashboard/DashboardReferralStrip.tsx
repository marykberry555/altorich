"use client";

import Link from "next/link";
import type { VipLevelConfig } from "@/lib/referral/types";
import { computeProgressToTarget } from "@/lib/referral/vip-display";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  vipLabel: string;
  commissionRate: number;
  verifiedCount: number;
  referralCount: number;
  nextTier: VipLevelConfig | null;
  className?: string;
};

export function DashboardReferralStrip({
  vipLabel,
  commissionRate,
  verifiedCount,
  referralCount,
  nextTier,
  className
}: Props) {
  const progress = nextTier
    ? computeProgressToTarget(verifiedCount, nextTier.min_members)
    : { progressPct: 100, remaining: 0, label: "Highest tier unlocked" };

  return (
    <Card variant="elevated" padding="none" className={cn("overflow-hidden", className)}>
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-[var(--emerald)] to-[var(--gold)]" aria-hidden />
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Referral progress</p>
          <p className="mt-1 text-lg font-bold text-[var(--heading)]">
            {vipLabel} · {commissionRate}% commission
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {referralCount} invited · {verifiedCount} verified investors
          </p>
        </div>

        <div className="w-full sm:max-w-xs">
          {nextTier ? (
            <>
              <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
                <span>{progress.remaining} to {nextTier.label}</span>
                <span className="tabular-nums">{progress.progressPct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-[var(--emerald)] transition-all duration-700"
                  style={{ width: `${progress.progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-[var(--emerald)]">Highest tier unlocked</p>
          )}
          <Link href="/team" className="mt-3 inline-block text-sm font-semibold text-[var(--emerald)] hover:underline">
            View referrals →
          </Link>
        </div>
      </div>
    </Card>
  );
}
