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

const UNIT_TONES = [
  {
    shell:
      "border-[var(--emerald)]/40 bg-[var(--surface-raised)] shadow-[0_10px_28px_-14px_rgba(16,185,129,0.65)]",
    value: "bg-gradient-to-br from-[var(--emerald-light)] to-[var(--emerald)] text-white",
    label: "text-[var(--emerald)]"
  },
  {
    shell:
      "border-teal-500/35 bg-[var(--surface-raised)] shadow-[0_10px_28px_-14px_rgba(20,184,166,0.55)]",
    value: "bg-gradient-to-br from-teal-400 to-teal-600 text-white",
    label: "text-teal-600"
  },
  {
    shell:
      "border-[var(--gold)]/45 bg-[var(--surface-raised)] shadow-[0_10px_28px_-14px_rgba(184,134,11,0.55)]",
    value: "bg-gradient-to-br from-[var(--gold-light)] to-[var(--gold)] text-white",
    label: "text-[var(--gold)]"
  },
  {
    shell:
      "border-sky-500/35 bg-[var(--surface-raised)] shadow-[0_10px_28px_-14px_rgba(14,165,233,0.5)]",
    value: "bg-gradient-to-br from-sky-400 to-sky-600 text-white",
    label: "text-sky-600"
  }
] as const;

function CountdownBlock({
  value,
  label,
  compact,
  muted,
  toneIndex = 0
}: {
  value: string;
  label: string;
  compact?: boolean;
  muted?: boolean;
  toneIndex?: number;
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

  const tone = UNIT_TONES[toneIndex % UNIT_TONES.length];

  return (
    <div
      className={cn(
        "flex min-w-[4.25rem] flex-1 flex-col items-center rounded-2xl border px-2 py-2.5 sm:min-w-[5rem] sm:px-3",
        tone.shell
      )}
    >
      <span
        className={cn(
          "flex h-10 w-full min-w-[2.75rem] items-center justify-center rounded-xl text-xl font-black tabular-nums sm:h-11 sm:text-2xl",
          tone.value
        )}
      >
        {value}
      </span>
      <span className={cn("mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em]", tone.label)}>
        {label}
      </span>
    </div>
  );
}

function ColorfulCountdown({
  days,
  hours,
  minutes,
  seconds,
  className
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--emerald)]/30",
        "bg-gradient-to-br from-[var(--emerald-soft)] via-[var(--surface-raised)] to-[var(--gold-soft)]",
        "p-4 shadow-[var(--shadow-glow)] sm:p-5",
        className
      )}
      aria-labelledby="payout-countdown-heading"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[var(--emerald)]/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-[var(--gold)]/15 blur-2xl"
        aria-hidden
      />

      <p
        id="payout-countdown-heading"
        className="relative text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--emerald)] sm:text-sm"
      >
        Settlement In
      </p>
      <div
        className="relative mt-3 flex gap-2 sm:gap-3"
        role="timer"
        aria-live="polite"
        suppressHydrationWarning
      >
        <CountdownBlock value={String(days)} label="Days" toneIndex={0} />
        <CountdownBlock value={pad2(hours)} label="Hours" toneIndex={1} />
        <CountdownBlock value={pad2(minutes)} label="Minutes" toneIndex={2} />
        <CountdownBlock value={pad2(seconds)} label="Seconds" toneIndex={3} />
      </div>
      <p className="relative mt-3 text-center text-xs text-[var(--text-muted)] sm:text-sm">
        Next Settlement:{" "}
        <span className="font-bold text-[var(--heading)]">Monday · 09:00 WAT</span>
      </p>
    </div>
  );
}

function MutedCountdown({
  days,
  hours,
  minutes,
  seconds,
  className,
  align = "center"
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  className?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(align === "center" ? "text-center" : "text-left", className)}
      aria-labelledby="payout-countdown-heading"
    >
      <p
        id="payout-countdown-heading"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]"
      >
        Settlement In
      </p>
      <div
        className={cn(
          "mt-4 flex items-start gap-4 sm:gap-8",
          align === "center" ? "justify-center" : "justify-start"
        )}
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
  );
}

export function WeeklyCountdown({
  className,
  label = "Settlement in",
  compact = false,
  variant = "hero"
}: {
  className?: string;
  label?: string;
  compact?: boolean;
  /** `inline` = colorful hero countdown. `section` = full-width muted band. */
  variant?: "hero" | "section" | "inline";
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

  if (variant === "inline") {
    return (
      <ColorfulCountdown
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        className={className}
      />
    );
  }

  if (variant === "section") {
    return (
      <section
        className={cn("border-b border-[var(--border)] bg-[var(--surface)] section-pad-sm", className)}
      >
        <div className="container-ar mx-auto max-w-2xl">
          <MutedCountdown days={days} hours={hours} minutes={minutes} seconds={seconds} />
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
        <CountdownBlock value={String(days)} label="Days" toneIndex={0} />
        <CountdownBlock value={pad2(hours)} label="Hours" toneIndex={1} />
        <CountdownBlock value={pad2(minutes)} label="Mins" toneIndex={2} />
        <CountdownBlock value={pad2(seconds)} label="Secs" toneIndex={3} />
      </div>
      <p className="mt-3 text-center text-xs text-[var(--text-muted)] sm:text-left">
        Next Settlement: <span className="font-semibold text-[var(--heading)]">Monday 09:00 WAT</span>
      </p>
    </div>
  );
}
