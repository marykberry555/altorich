"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { weeklyCountdownTarget } from "@/lib/roi/time";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function splitSeconds(total: number) {
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { days, hours, minutes, seconds };
}

function CountdownBlock({ value, label, compact }: { value: string; label: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-[var(--emerald)]/30 bg-[var(--emerald-soft)]/40 px-1.5 py-1 min-w-[2.5rem]">
        <span className="text-sm font-bold tabular-nums text-[var(--emerald)]">{value}</span>
        <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-[4.25rem] flex-1 flex-col items-center rounded-xl border-2 border-[var(--emerald)]/45 bg-[var(--surface-raised)] px-2 py-2.5 shadow-sm sm:min-w-[5rem] sm:px-3">
      <span className="flex h-10 w-full min-w-[2.75rem] items-center justify-center rounded-lg bg-[var(--emerald)] text-xl font-bold tabular-nums text-white sm:h-11 sm:text-2xl">
        {value}
      </span>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

export function WeeklyCountdown({
  className,
  label = "Payout in",
  compact = false
}: {
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => weeklyCountdownTarget(now).secondsRemaining, [now]);
  const { days, hours, minutes, seconds } = splitSeconds(remaining);

  if (compact) {
    return (
      <div className={cn("w-full", className)} role="timer" aria-live="polite">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="shrink-0 text-[var(--emerald)]" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--emerald)]">{label}</p>
        </div>
        <div className="mt-2 flex gap-1">
          <CountdownBlock value={String(days)} label="D" compact />
          <CountdownBlock value={pad2(hours)} label="H" compact />
          <CountdownBlock value={pad2(minutes)} label="M" compact />
          <CountdownBlock value={pad2(seconds)} label="S" compact />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border-2 border-[var(--emerald)]/35 bg-gradient-to-br from-[var(--emerald-soft)] via-[var(--surface-raised)] to-[var(--surface-raised)] p-4 shadow-[var(--shadow-glow)] sm:p-5",
        className
      )}
      role="timer"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--emerald)] text-white">
          <Clock size={18} aria-hidden />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--emerald)] sm:text-sm">{label}</p>
      </div>

      <div className="mt-3 flex gap-2 sm:gap-3">
        <CountdownBlock value={String(days)} label="Days" />
        <CountdownBlock value={pad2(hours)} label="Hours" />
        <CountdownBlock value={pad2(minutes)} label="Mins" />
        <CountdownBlock value={pad2(seconds)} label="Secs" />
      </div>

      <p className="mt-3 text-center text-xs text-[var(--text-muted)] sm:text-left">
        Next payout: <span className="font-semibold text-[var(--heading)]">Monday 09:00 WAT</span>
      </p>
    </div>
  );
}
