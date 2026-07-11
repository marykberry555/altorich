"use client";

import Link from "next/link";
import type { VipLevelConfig } from "@/lib/referral/types";
import { computeProgressToTarget } from "@/lib/referral/vip-display";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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

  const isNewReferrer = referralCount === 0 && verifiedCount === 0;

  return (
    <Card variant="elevated" padding="none" className={cn("overflow-hidden", className)}>
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-[var(--emerald)] to-[var(--gold)]" aria-hidden />
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Referral progress</p>
          {isNewReferrer ? (
            <>
              <p className="mt-2 text-lg font-bold leading-snug text-[var(--heading)]">
                Invite your first investor and unlock your journey toward {nextTier?.label ?? "Growth"} status.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Current commission</dt>
                  <dd className="text-lg font-bold text-[var(--emerald)]">{commissionRate}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Next level</dt>
                  <dd className="text-lg font-bold text-[var(--heading)]">{nextTier?.label ?? "Growth"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Need</dt>
                  <dd className="text-lg font-bold text-[var(--heading)]">{nextTier?.min_members ?? 5} verified</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-bold text-[var(--heading)]">
                {vipLabel} · {commissionRate}% commission
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {referralCount} invited · {verifiedCount} verified investors
              </p>
            </>
          )}
        </div>

        <div className="w-full sm:max-w-xs">
          {!isNewReferrer && nextTier ? (
            <>
              <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
                <span>
                  {progress.remaining} to {nextTier.label}
                </span>
                <span className="tabular-nums">{progress.progressPct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-[var(--emerald)] transition-all duration-700"
                  style={{ width: `${progress.progressPct}%` }}
                />
              </div>
            </>
          ) : null}
          <Link href="/team" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Invite friends
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
