"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNaira } from "@/lib/domain";
import { computeWeeklyTicker } from "@/lib/roi/math";
import { weeklyCountdownTarget } from "@/lib/roi/time";
import { cn } from "@/lib/utils";

type Props = {
  principalNgn: number;
  weeklyRoiBps: number;
  cycleStartedAt: string;
  cycleEndsAt: string;
  className?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function EarningsTicker(props: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const computed = useMemo(() => {
    return computeWeeklyTicker({
      principalNgn: props.principalNgn,
      weeklyRoiBps: props.weeklyRoiBps,
      cycleStartedAt: props.cycleStartedAt,
      cycleEndsAt: props.cycleEndsAt,
      now
    });
  }, [now, props.principalNgn, props.weeklyRoiBps, props.cycleStartedAt, props.cycleEndsAt]);

  const payoutRemaining = weeklyCountdownTarget(now).secondsRemaining;
  const days = Math.floor(payoutRemaining / 86400);
  const hours = Math.floor((payoutRemaining % 86400) / 3600);
  const minutes = Math.floor((payoutRemaining % 3600) / 60);
  const progressPct = Math.round(computed.progress * 100);

  return (
    <div className={cn("grid gap-4", props.className)}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Weekly earnings (live)</p>
        <p className="currency-ngn mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">{formatNaira(computed.accrued)}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {formatNaira(computed.perSecond)}/sec · Target {formatNaira(computed.weeklyInterest)} this week
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Cycle progress</span>
          <span className="font-semibold tabular-nums text-[var(--heading)]">{progressPct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--gray-100)]">
          <div
            className="h-full rounded-full bg-[var(--emerald)] transition-[width] duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Matures Monday · {days}d {pad2(hours)}h {pad2(minutes)}m remaining
        </p>
      </div>
    </div>
  );
}
