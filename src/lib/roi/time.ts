import { getWatParts, nextMondayNineAmWat, watToUtc } from "@/lib/investment/accrual-math";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const SECONDS_IN_WEEK = 7 * 24 * 60 * 60; // 604,800

/**
 * Next Monday at 09:00 Africa/Lagos as a real UTC instant.
 * If currently Monday before 09:00 WAT, returns today 09:00 WAT.
 * If Monday at/after 09:00 WAT, returns next week's Monday 09:00 WAT.
 */
export function nextMondayAt9amLagos(now = new Date()): Date {
  const p = getWatParts(now);
  if (p.dayOfWeek === 1 && p.hour < 9) {
    return watToUtc(p.year, p.month, p.day, 9, 0);
  }
  // Strictly after `now` — covers Mon≥09:00 and all other weekdays.
  return nextMondayNineAmWat(now);
}

export function weeklyCountdownTarget(now = new Date()): { target: Date; secondsRemaining: number } {
  const target = nextMondayAt9amLagos(now);
  const secondsRemaining = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return { target, secondsRemaining };
}

/**
 * Weekly ticker window:
 * - Start: Monday 10:01 Lagos time
 * - End: next Monday 10:00 Lagos time
 */
export function currentTickerWindowLagos(now = new Date()): { start: Date; end: Date } {
  const nextMon9 = nextMondayAt9amLagos(now);
  // Monday 10:00 WAT = Monday 09:00 WAT + 1h
  const end = new Date(nextMon9.getTime() + 60 * 60 * 1000);
  // Previous Monday 10:01 WAT
  const start = new Date(end.getTime() - WEEK_MS + 60_000);
  return { start, end };
}

export function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
