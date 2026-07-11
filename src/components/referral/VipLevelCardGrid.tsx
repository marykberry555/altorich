"use client";

import { Check, Lock } from "lucide-react";
import type { VipLevelConfig } from "@/lib/referral/types";
import { formatNaira } from "@/lib/domain";
import {
  buildVipBenefitLines,
  getVipBadgeLabel,
  getVipDisplayTitle,
  getVipLevelState,
  type VipLevelState
} from "@/lib/referral/vip-display";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Props = {
  tiers: VipLevelConfig[];
  currentLevel: number;
  className?: string;
};

const STATE_STYLES: Record<VipLevelState, string> = {
  current: "border-[var(--emerald)]/45 bg-[var(--emerald-soft)]/25 ring-2 ring-[var(--emerald)]/20 shadow-[var(--shadow-sm)]",
  completed: "border-[var(--border)] bg-[var(--surface-raised)]",
  locked: "border-[var(--border)] bg-[var(--gray-50)]/50 dark:bg-[var(--surface)]/40"
};

function StateBadge({ state }: { state: VipLevelState }) {
  if (state === "current") return <Badge variant="emerald">Current</Badge>;
  if (state === "completed") return <Badge variant="gold">Completed</Badge>;
  return (
    <Badge variant="outline" className="gap-1">
      <Lock size={10} aria-hidden />
      Locked
    </Badge>
  );
}

export function VipLevelCardGrid({ tiers, currentLevel, className }: Props) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {tiers.map((tier) => {
        const state = getVipLevelState(tier.level, currentLevel);
        const benefits = buildVipBenefitLines(tier);

        return (
          <article
            key={tier.level}
            className={cn(
              "flex flex-col rounded-[var(--radius)] border p-5 transition",
              STATE_STYLES[state],
              state === "locked" && "opacity-85"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
                  {getVipBadgeLabel(tier.level)}
                </p>
                <h3 className="mt-1 text-base font-bold leading-snug text-[var(--heading)]">
                  {getVipDisplayTitle(tier.level, tier.label)}
                </h3>
              </div>
              <StateBadge state={state} />
            </div>

            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {tier.min_members === 0 ? "0 Verified Investors" : `${tier.min_members} Verified Investors`}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">{tier.commission_percent}%</p>
            <p className="text-xs font-medium text-[var(--text-subtle)]">Referral Commission</p>

            {tier.milestone_bonus > 0 ? (
              <p className="currency-ngn mt-3 text-sm font-semibold text-[var(--gold)]">
                {formatNaira(tier.milestone_bonus)} Milestone Bonus
              </p>
            ) : null}

            <ul className="mt-4 flex-1 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
              {benefits.map((line) => (
                <li key={line} className="flex items-start gap-2 text-[var(--text-muted)]">
                  <Check size={14} className="mt-0.5 shrink-0 text-[var(--emerald)]" aria-hidden />
                  <span>
                    {line === "Milestone bonus at unlock" && tier.milestone_bonus > 0
                      ? `${formatNaira(tier.milestone_bonus)} Milestone Bonus`
                      : line}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
