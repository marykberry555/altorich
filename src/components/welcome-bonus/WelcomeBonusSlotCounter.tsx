"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import type { WelcomeBonusProgrammeStatus } from "@/lib/welcome-bonus/programme-status";
import { resolveSlotCounterVariant } from "@/lib/welcome-bonus/programme-status";
import { DEFAULT_WELCOME_BONUS_CONFIG } from "@/lib/welcome-bonus/config";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
  initialStatus?: WelcomeBonusProgrammeStatus | null;
};

const FALLBACK = {
  enabled: DEFAULT_WELCOME_BONUS_CONFIG.enabled,
  amount: DEFAULT_WELCOME_BONUS_CONFIG.amount_ngn,
  maxAllocations: DEFAULT_WELCOME_BONUS_CONFIG.max_allocations,
  allocated: 0,
  remaining: DEFAULT_WELCOME_BONUS_CONFIG.max_allocations,
  qualificationDays: DEFAULT_WELCOME_BONUS_CONFIG.qualification_days,
  fullyAllocated: false
} satisfies WelcomeBonusProgrammeStatus;

export function WelcomeBonusSlotCounter({ className, compact = false, initialStatus = null }: Props) {
  const [status, setStatus] = useState<WelcomeBonusProgrammeStatus>(initialStatus ?? FALLBACK);
  const [loading, setLoading] = useState(!initialStatus);

  useEffect(() => {
    if (initialStatus) return;
    let cancelled = false;
    fetch("/api/welcome-bonus/programme")
      .then((res) => res.json())
      .then((data: WelcomeBonusProgrammeStatus) => {
        if (!cancelled && data?.maxAllocations) setStatus(data);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialStatus]);

  const variant = resolveSlotCounterVariant(status);

  const message =
    variant === "closed"
      ? "Promotion currently closed"
      : variant === "full"
        ? "Promotion fully allocated"
        : `${status.remaining.toLocaleString("en-NG")} of ${status.maxAllocations.toLocaleString("en-NG")} slots remaining`;

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/25 bg-[var(--gold-soft)] px-3 py-1.5 text-xs font-medium text-[var(--heading)]",
          className
        )}
        aria-live="polite"
      >
        <Gift size={14} className="shrink-0 text-[var(--gold)]" aria-hidden />
        <span>{loading ? "Loading bonus slots…" : message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-[var(--gold)]/20 bg-gradient-to-br from-[var(--gold-soft)] to-amber-50/60 p-4 dark:from-amber-500/10 dark:to-transparent",
        className
      )}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold)]">
          <Gift size={20} aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">Welcome Bonus</p>
          <p className="mt-1 text-lg font-bold text-[var(--heading)]">{formatNaira(status.amount)}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {loading ? "Checking availability…" : message}
          </p>
          {variant === "open" ? (
            <p className="mt-1 text-xs text-[var(--text-subtle)]">
              Unlocks on Monday 09:00 WAT settlement
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
