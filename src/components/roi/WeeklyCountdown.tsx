"use client";

import { useEffect, useMemo, useState } from "react";
import { weeklyCountdownTarget } from "@/lib/roi/time";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function splitSeconds(total: number) {
  const safe = Math.max(0, total);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { days, hours, minutes, seconds };
}

function CountdownBlock({
  value,
  label,
  compact,
  muted
}: {
  value: string;
  label: string;
  compact?: boolean;
  muted?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex min-w-[2.5rem] flex-col items-center rounded-lg border border-[var(--emerald)]/30 bg-[var(--emerald-soft)]/40 px-1.5 py-1">
        <span className="text-sm font-bold tabular-nums text-[var(--emerald)]">{value}</span>
        <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      </div>
    );
  }

  if (muted) {
    return (
      <div className="flex min-w-[3.75rem] flex-1 flex-col items-center sm:min-w-[4.5rem]">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-[var(--heading)] sm:text-3xl">
          {value}
        </span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-subtle)]">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-[4.25rem] flex-1 flex-col items-center rounded-xl border-2 border-[var(--emerald)]/45 bg-[var(--surface-raised)] px-2 py-2.5 shadow-sm sm:min-w-[5rem] sm:px-3">
      <span className="flex h-10 w-full min-w-[2.75rem] items-center justify-center rounded-lg bg-[var(--emerald)] text-xl font-bold tabular-nums text-white sm:h-11 sm:text-2xl">
        {value}
      </span>
      <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}

export function WeeklyCountdown({
  className,
  label = "Payout in",
  compact = false,
  variant = "hero"
}: {
  className?: string;
  label?: string;
  compact?: boolean;
  /** `section` = quieter informational band below the calculator. */
  variant?: "hero" | "section";
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = useMemo(() => weeklyCountdownTarget(now).secondsRemaining, [now]);
  const { days, hours, minutes, seconds } = splitSeconds(remaining);

  if (compact) {
    return (
      <div className={cn("w-full", className)} role="timer" aria-live="polite">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--emerald)]">{label}</p>
        </div>
        <div className="mt-2 flex gap-1" suppressHydrationWarning>
          <CountdownBlock value={String(days)} label="D" compact />
          <CountdownBlock value={pad2(hours)} label="H" compact />
          <CountdownBlock value={pad2(minutes)} label="M" compact />
          <CountdownBlock value={pad2(seconds)} label="S" compact />
        </div>
      </div>
    );
  }

  if (variant === "section") {
    return (
      <section
        className={cn("border-b border-[var(--border)] bg-[var(--surface)] section-pad-sm", className)}
        aria-labelledby="payout-countdown-heading"
      >
        <div className="container-ar mx-auto max-w-2xl text-center">
          <p
            id="payout-countdown-heading"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]"
          >
            Payout In
          </p>
          <div
            className="mt-4 flex items-start justify-center gap-4 sm:gap-8"
            role="timer"
            aria-live="polite"
            suppressHydrationWarning
          >
            <CountdownBlock value={String(days)} label="Days" muted />
            <CountdownBlock value={pad2(hours)} label="Hours" muted />
            <CountdownBlock value={pad2(minutes)} label="Minutes" muted />
            <CountdownBlock value={pad2(seconds)} label="Seconds" muted />
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Next Settlement:{" "}
            <span className="font-semibold text-[var(--heading)]">Monday · 09:00 WAT</span>
          </p>
        </div>
      </section>
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
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--emerald)] sm:text-sm">{label}</p>
      <div className="mt-3 flex gap-2 sm:gap-3" suppressHydrationWarning>
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
