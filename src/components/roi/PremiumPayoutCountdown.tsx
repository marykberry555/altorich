"use client";

import { useMemo } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { weeklyCountdownTarget } from "@/lib/roi/time";
import { useLiveNow } from "@/lib/hooks/use-live-now";
import { AnimatedCountdownDigit } from "@/components/roi/AnimatedCountdownDigit";
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

type Props = {
  className?: string;
  variant?: "hero" | "compact";
};

export function PremiumPayoutCountdown({ className, variant = "hero" }: Props) {
  const now = useLiveNow();
  const remaining = useMemo(() => weeklyCountdownTarget(now).secondsRemaining, [now]);
  const { days, hours, minutes, seconds } = splitSeconds(remaining);
  const progress = Math.min(100, Math.max(0, ((7 * 86400 - remaining) / (7 * 86400)) * 100));

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-[var(--emerald)]/25 bg-[var(--emerald-soft)]/40 px-3 py-1.5 text-xs",
          className
        )}
        role="timer"
        aria-live="polite"
      >
        <CalendarClock size={14} className="text-[var(--emerald)]" aria-hidden />
        <span className="font-medium text-[var(--text-muted)]">Next payout</span>
        <span className="font-semibold tabular-nums text-[var(--heading)]">
          {days}d {pad2(hours)}h {pad2(minutes)}m
        </span>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[var(--emerald)]/20 bg-gradient-to-br from-[#064e3b] via-[#0a6b52] to-[#042f24] p-6 text-white shadow-[0_20px_60px_rgba(6,78,59,0.35)] sm:p-8",
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Next weekly payout in ${days} days, ${hours} hours, ${minutes} minutes`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal-300/10 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-emerald-200/90">
            <Sparkles size={16} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Weekly payout cycle</p>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your next payout lands Monday</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            Settlements are processed 09:00 WAT. Track your cycle below — built for Nigerian investors who value clarity.
          </p>
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-white/60">
              <span>Cycle progress</span>
              <span className="tabular-nums text-white/90">{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200 transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <AnimatedCountdownDigit value={String(days)} label="Days" />
          <span className="pb-6 text-2xl font-light text-white/40">:</span>
          <AnimatedCountdownDigit value={pad2(hours)} label="Hours" />
          <span className="pb-6 text-2xl font-light text-white/40">:</span>
          <AnimatedCountdownDigit value={pad2(minutes)} label="Mins" />
          <span className="pb-6 text-2xl font-light text-white/40">:</span>
          <AnimatedCountdownDigit value={pad2(seconds)} label="Secs" />
        </div>
      </div>
    </section>
  );
}
