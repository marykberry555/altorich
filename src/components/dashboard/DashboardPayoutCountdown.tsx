"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { nextPayoutProcessingAt } from "@/lib/payout/schedule";
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
  active?: boolean;
  className?: string;
};

export function DashboardPayoutCountdown({ active = true, className }: Props) {
  const now = useLiveNow();
  const target = useMemo(() => nextPayoutProcessingAt(now), [now]);
  const remaining = useMemo(
    () => Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000)),
    [now, target]
  );
  const { days, hours, minutes, seconds } = splitSeconds(remaining);

  if (!active) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5",
          className
        )}
      >
        <div className="flex items-center gap-2 text-white/65">
          <CalendarClock size={15} aria-hidden />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Next payout</p>
        </div>
        <p className="mt-2 text-lg font-semibold text-white/90">Not scheduled</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm sm:px-5 sm:py-5",
        className
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Next payout Monday 9 AM. ${days} days, ${hours} hours remaining`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-white/65">
            <CalendarClock size={15} aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Next payout</p>
          </div>
          <p className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Monday</p>
          <p className="text-sm font-medium text-emerald-200">9:00 AM WAT</p>
        </div>

        <div className="flex items-center justify-start gap-1.5 sm:justify-end sm:gap-2">
          <AnimatedCountdownDigit value={String(days)} label="Days" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12 sm:[&_div:first-child]:h-14 sm:[&_div:first-child]:w-14" />
          <span className="pb-5 text-lg font-light text-white/35">:</span>
          <AnimatedCountdownDigit value={pad2(hours)} label="Hours" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12 sm:[&_div:first-child]:h-14 sm:[&_div:first-child]:w-14" />
          <span className="pb-5 text-lg font-light text-white/35">:</span>
          <AnimatedCountdownDigit value={pad2(minutes)} label="Mins" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12 sm:[&_div:first-child]:h-14 sm:[&_div:first-child]:w-14" />
          <span className="pb-5 text-lg font-light text-white/35">:</span>
          <AnimatedCountdownDigit value={pad2(seconds)} label="Secs" className="[&_div:first-child]:h-12 [&_div:first-child]:w-12 sm:[&_div:first-child]:h-14 sm:[&_div:first-child]:w-14" />
        </div>
      </div>
    </div>
  );
}
