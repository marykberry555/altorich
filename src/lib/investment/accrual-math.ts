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

/** Next Monday 09:00 WAT strictly after `from`. */
export function nextMondayNineAmWat(from: Date): Date {
  const start = from.getTime();
  for (let offset = 0; offset <= 8 * MS_PER_WEEK; offset += 60 * 60 * 1000) {
    const candidate = new Date(start + offset);
    const p = getWatParts(candidate);
    if (p.dayOfWeek === 1 && p.hour === 9 && p.minute === 0 && candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }
  return new Date(start + MS_PER_WEEK);
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
    periodTarget = weeklyInterestForAmount(input.principal, input.weeklyRoiBps);
  } else {
    const step = periodDays(input.frequency);
    const daily = input.projectedDaily ?? 0;
    periodTarget = daily * step;
  }

  const accrued = Math.round(periodTarget * progress * 100) / 100;
  return { accrued, periodTarget, progress };
}

export function settlementInterestForInvestment(input: {
  principal: number;
  weeklyRoiBps: number;
  startedAt: Date;
  lastWeeklySettlementAt?: Date | null;
  endsAt?: Date | null;
  asOf: Date;
}): number {
  const { periodStart, periodEnd } = resolveAccrualPeriod(
    {
      startedAt: input.startedAt,
      lastWeeklySettlementAt: input.lastWeeklySettlementAt,
      endsAt: input.endsAt,
      asOf: input.asOf
    },
    "weekly"
  );

  const settlementMoment = input.asOf.getTime() < periodEnd.getTime() ? input.asOf : periodEnd;

  return proRataInterest({
    principal: input.principal,
    weeklyRoiBps: input.weeklyRoiBps,
    frequency: "weekly",
    periodStart,
    periodEnd,
    asOf: settlementMoment
  }).accrued;
}
