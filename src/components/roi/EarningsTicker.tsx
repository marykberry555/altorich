"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNaira } from "@/lib/domain";
import { computeWeeklyTicker } from "@/lib/roi/math";

type Props = {
  principalNgn: number;
  weeklyRoiBps: number;
  cycleStartedAt: string;
  cycleEndsAt: string;
  className?: string;
};

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

  return (
    <div className={props.className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Earnings (live)</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">{formatNaira(computed.accrued)}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {formatNaira(computed.perSecond)}/sec · Target {formatNaira(computed.weeklyInterest)} this week
      </p>
    </div>
  );
}

