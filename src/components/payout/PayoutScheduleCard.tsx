"use client";

import { useEffect, useMemo, useState } from "react";
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

export function PayoutScheduleCard({ className }: { className?: string }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const now = useLiveNow();
  const target = useMemo(() => nextPayoutProcessingAt(now), [now]);
  const remaining = useMemo(
    () => Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000)),
    [now, target]
  );
  const { days, hours, minutes, seconds } = splitSeconds(remaining);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--navy)] via-[var(--navy-mid)] to-[var(--emerald)] p-6 text-white sm:p-8",
        className
      )}
      role="timer"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-white/70">
            <CalendarClock size={16} aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Next processing window</p>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Monday</p>
          <p className="mt-1 text-lg font-medium text-emerald-200">9:00 AM WAT</p>
          <p className="mt-3 max-w-sm text-sm text-white/75">
            Submit a withdrawal anytime — requests are queued and processed on the next cycle.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {hydrated ? (
            <>
              <AnimatedCountdownDigit value={String(days)} label="Days" />
              <span className="pb-6 text-2xl font-light text-white/40">:</span>
              <AnimatedCountdownDigit value={pad2(hours)} label="Hours" />
              <span className="pb-6 text-2xl font-light text-white/40">:</span>
              <AnimatedCountdownDigit value={pad2(minutes)} label="Mins" />
              <span className="pb-6 text-2xl font-light text-white/40">:</span>
              <AnimatedCountdownDigit value={pad2(seconds)} label="Secs" />
            </>
          ) : (
            <div className="flex items-center gap-2 text-white/60" aria-hidden>
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">Loading schedule…</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
