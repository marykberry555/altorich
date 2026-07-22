import { weeklyInterestForAmount } from "@/lib/packages/tier-config";
import type { SettlementFrequency } from "@/lib/investment";

const WAT_OFFSET_MS = 60 * 60 * 1000;
const MS_PER_WEEK = 7 * 86400000;

export type AccrualPeriodInput = {
  startedAt: Date;
  lastSettlementAt?: Date | null;
  lastWeeklySettlementAt?: Date | null;
  endsAt?: Date | null;
  asOf?: Date;
};

export type AccrualPeriodBounds = {
  periodStart: Date;
  periodEnd: Date;
};

/** WAT calendar parts (Africa/Lagos, fixed UTC+1). */
export function getWatParts(date: Date) {
  const wat = new Date(date.getTime() + WAT_OFFSET_MS);
  return {
    year: wat.getUTCFullYear(),
    month: wat.getUTCMonth() + 1,
    day: wat.getUTCDate(),
    hour: wat.getUTCHours(),
    minute: wat.getUTCMinutes(),
    dayOfWeek: wat.getUTCDay()
  };
}

export function watToUtc(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0, 0));
}

/** Next Monday 9:00 AM at or after the next 9:00 AM slot (strictly after `from`). */
export function nextMondayNineAmWat(from: Date): Date {
  const p = getWatParts(from);
  // Days until next Monday (1). If today is Monday, 0 unless we're at/past 09:00.
  let addDays = (1 - p.dayOfWeek + 7) % 7;
  const todayNine = watToUtc(p.year, p.month, p.day, 9, 0);
  if (addDays === 0 && from.getTime() >= todayNine.getTime()) {
    addDays = 7;
  }
  if (addDays === 0) {
    return todayNine;
  }

  // Advance calendar day in WAT space.
  const noonUtc = watToUtc(p.year, p.month, p.day, 12, 0);
  const targetDay = new Date(noonUtc.getTime() + addDays * 86400000);
  const tp = getWatParts(targetDay);
  return watToUtc(tp.year, tp.month, tp.day, 9, 0);
}

export function periodDays(frequency: SettlementFrequency): number {
  if (frequency === "weekly") return 7;
  if (frequency === "monthly") return 30;
  if (frequency === "maturity") return 1;
  return 1;
}

export function resolveAccrualPeriod(input: AccrualPeriodInput, frequency: SettlementFrequency): AccrualPeriodBounds {
  const asOf = input.asOf ?? new Date();
  const lastMark =
    input.lastWeeklySettlementAt ?? input.lastSettlementAt ?? null;
  const periodStart = lastMark ? new Date(lastMark) : new Date(input.startedAt);

  let periodEnd: Date;
  if (frequency === "weekly") {
    periodEnd = nextMondayNineAmWat(periodStart);
    if (periodEnd.getTime() <= periodStart.getTime()) {
      periodEnd = new Date(periodEnd.getTime() + MS_PER_WEEK);
    }
  } else {
    const stepMs = periodDays(frequency) * 86400000;
    periodEnd = new Date(periodStart.getTime() + stepMs);
  }

  if (input.endsAt) {
    const ends = new Date(input.endsAt);
    if (periodEnd > ends) periodEnd = ends;
  }

  if (periodEnd.getTime() <= periodStart.getTime()) {
    periodEnd = new Date(periodStart.getTime() + 86400000);
  }

  if (asOf > periodEnd && frequency === "weekly") {
    // Display window: if past period end, anchor to next cycle from last mark
    while (periodEnd.getTime() <= asOf.getTime() && (!input.endsAt || periodEnd < new Date(input.endsAt))) {
      const next = nextMondayNineAmWat(periodEnd);
      if (next.getTime() <= periodEnd.getTime()) break;
      periodStart.setTime(periodEnd.getTime());
      periodEnd = next;
      if (input.endsAt && periodEnd > new Date(input.endsAt)) {
        periodEnd = new Date(input.endsAt);
        break;
      }
    }
  }

  return { periodStart: new Date(periodStart), periodEnd };
}

export function proRataInterest(input: {
  principal: number;
  weeklyRoiBps: number;
  projectedDaily?: number;
  frequency: SettlementFrequency;
  periodStart: Date;
  periodEnd: Date;
  asOf: Date;
}): { accrued: number; periodTarget: number; progress: number } {
  const periodMs = Math.max(1, input.periodEnd.getTime() - input.periodStart.getTime());
  const elapsedMs = Math.min(
    Math.max(0, input.asOf.getTime() - input.periodStart.getTime()),
    periodMs
  );
  const progress = elapsedMs / periodMs;

  let periodTarget: number;
  if (input.frequency === "weekly" && input.weeklyRoiBps > 0) {
    const fullWeek = weeklyInterestForAmount(input.principal, input.weeklyRoiBps);
    // Mid-week starts must not earn a full 35% — scale by actual period length / 7d.
    periodTarget = fullWeek * Math.min(1, periodMs / MS_PER_WEEK);
  } else {
    const step = periodDays(input.frequency);
    const daily = input.projectedDaily ?? 0;
    periodTarget = daily * step;
  }

  const accrued = periodTarget * progress;
  return { accrued, periodTarget, progress };
}

/**
 * Interest due for a completed weekly period ending at/before `asOf`.
 * Does not roll into the next open week (avoids ~0 interest when cron runs after Monday 09:00).
 */
export function weeklySettlementWindow(input: {
  startedAt: Date;
  lastWeeklySettlementAt?: Date | null;
  endsAt?: Date | null;
}): { periodStart: Date; periodEnd: Date } | null {
  const periodStart = new Date(input.lastWeeklySettlementAt ?? input.startedAt);
  let periodEnd = nextMondayNineAmWat(periodStart);
  if (periodEnd.getTime() <= periodStart.getTime()) {
    periodEnd = new Date(periodEnd.getTime() + MS_PER_WEEK);
  }
  if (input.endsAt) {
    const ends = new Date(input.endsAt);
    if (periodEnd > ends) periodEnd = ends;
  }
  if (periodEnd.getTime() <= periodStart.getTime()) {
    return null;
  }
  return { periodStart, periodEnd };
}

export function settlementInterestForInvestment(input: {
  principal: number;
  weeklyRoiBps: number;
  startedAt: Date;
  lastWeeklySettlementAt?: Date | null;
  endsAt?: Date | null;
  asOf: Date;
}): number {
  const window = weeklySettlementWindow(input);
  if (!window) return 0;

  const { periodStart, periodEnd } = window;

  // Period not complete — nothing to settle yet.
  if (input.asOf.getTime() < periodEnd.getTime()) {
    return 0;
  }

  const { accrued } = proRataInterest({
    principal: input.principal,
    weeklyRoiBps: input.weeklyRoiBps,
    frequency: "weekly",
    periodStart,
    periodEnd,
    asOf: periodEnd
  });
  return Math.round(accrued * 100) / 100;
}
