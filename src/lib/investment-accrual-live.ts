import type { SettlementFrequency } from "@/lib/investment";
import { proRataInterest, resolveAccrualPeriod } from "@/lib/investment/accrual-math";

export type LiveAccrualInput = {
  status: string;
  principalAmount: number;
  creditedTotal: number;
  projectedDaily: number;
  weeklyRoiBps?: number;
  settlementFrequency: SettlementFrequency;
  startedAt: string | Date | null;
  endsAt: string | Date | null;
  lastSettlementAt?: string | Date | null;
  lastWeeklySettlementAt?: string | Date | null;
};

export type LiveAccrualTick = {
  creditedTotal: number;
  periodStartMs: number;
  periodEndMs: number;
  periodTarget: number;
};

export type LiveRateTick = {
  baseAmount: number;
  ratePerSecond: number;
  anchorMs: number;
};

export type LiveAccrualState = {
  creditedTotal: number;
  liveTotal: number;
  todayAccrual: number;
  periodEarnings: number;
  periodTarget: number;
  dayProgressPercent: number;
  accrualPerSecond: number;
  nextAccrualInMs: number;
  isAccruing: boolean;
  nextSettlementAt: Date | null;
  estimatedNextSettlement: number;
  currentValue: number;
  periodStart: Date | null;
  periodEnd: Date | null;
};

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toLiveAccrualTick(state: LiveAccrualState, principal = 0): LiveAccrualTick | undefined {
  if (!state.periodStart || !state.periodEnd || !state.isAccruing) return undefined;
  return {
    creditedTotal: state.creditedTotal + principal,
    periodStartMs: state.periodStart.getTime(),
    periodEndMs: state.periodEnd.getTime(),
    periodTarget: state.periodTarget
  };
}

export function toLiveRateTick(aggregate: LiveEarningsAggregate, now: Date, baseAmount: number): LiveRateTick | undefined {
  if (!aggregate.isAccruing || aggregate.accrualPerSecond <= 0) return undefined;
  return {
    baseAmount,
    ratePerSecond: aggregate.accrualPerSecond,
    anchorMs: now.getTime()
  };
}

export function calculateLiveAccrualState(input: LiveAccrualInput, now: Date = new Date()): LiveAccrualState {
  const principal = input.principalAmount;
  const creditedTotal = input.creditedTotal;
  const startedAt = toDate(input.startedAt);
  const endsAt = toDate(input.endsAt);
  const frequency = input.settlementFrequency ?? "weekly";
  const weeklyRoiBps = input.weeklyRoiBps ?? 0;

  const inactive =
    input.status !== "active" && input.status !== "stopping"
      ? true
      : !startedAt || (endsAt && now >= endsAt) || principal <= 0;

  if (inactive || !startedAt) {
    return {
      creditedTotal,
      liveTotal: creditedTotal,
      todayAccrual: 0,
      periodEarnings: 0,
      periodTarget: 0,
      dayProgressPercent: 0,
      accrualPerSecond: 0,
      nextAccrualInMs: 0,
      isAccruing: false,
      nextSettlementAt: null,
      estimatedNextSettlement: 0,
      currentValue: principal + creditedTotal,
      periodStart: null,
      periodEnd: null
    };
  }

  const { periodStart, periodEnd } = resolveAccrualPeriod(
    {
      startedAt,
      lastSettlementAt: toDate(input.lastSettlementAt),
      lastWeeklySettlementAt: toDate(input.lastWeeklySettlementAt),
      endsAt,
      asOf: now
    },
    frequency
  );

  const { accrued, periodTarget, progress } = proRataInterest({
    principal,
    weeklyRoiBps,
    projectedDaily: input.projectedDaily,
    frequency,
    periodStart,
    periodEnd,
    asOf: now
  });

  const periodMs = Math.max(1, periodEnd.getTime() - periodStart.getTime());
  const accrualPerSecond = (periodTarget / periodMs) * 1000;
  const liveTotal = creditedTotal + accrued;
  const nextAccrualInMs = Math.max(0, periodEnd.getTime() - now.getTime());

  return {
    creditedTotal,
    liveTotal,
    todayAccrual: accrued,
    periodEarnings: periodTarget,
    periodTarget,
    dayProgressPercent: Math.min(100, progress * 100),
    accrualPerSecond,
    nextAccrualInMs,
    isAccruing: progress < 1 && (!endsAt || now < endsAt),
    nextSettlementAt: periodEnd,
    estimatedNextSettlement: periodTarget,
    currentValue: principal + liveTotal,
    periodStart,
    periodEnd
  };
}

export type LiveEarningsAggregate = {
  totalPrincipal: number;
  totalCredited: number;
  totalLive: number;
  totalTodayAccrual: number;
  totalPeriodTarget: number;
  accrualPerSecond: number;
  activeCount: number;
  portfolioValue: number;
  isAccruing: boolean;
  nextAccrualInMs: number;
};

export function aggregateLiveAccrual(investments: LiveAccrualInput[], now: Date = new Date()): LiveEarningsAggregate {
  let totalPrincipal = 0;
  let totalCredited = 0;
  let totalLive = 0;
  let totalTodayAccrual = 0;
  let totalPeriodTarget = 0;
  let accrualPerSecond = 0;
  let activeCount = 0;
  let isAccruing = false;
  let nextAccrualInMs = Number.POSITIVE_INFINITY;

  for (const inv of investments) {
    const state = calculateLiveAccrualState(inv, now);
    totalPrincipal += inv.principalAmount;
    totalCredited += state.creditedTotal;
    totalLive += state.liveTotal;
    totalTodayAccrual += state.todayAccrual;
    if (inv.status === "active" || inv.status === "stopping") {
      activeCount += 1;
      totalPeriodTarget += state.periodEarnings;
      if (state.isAccruing) {
        isAccruing = true;
        accrualPerSecond += state.accrualPerSecond;
        nextAccrualInMs = Math.min(nextAccrualInMs, state.nextAccrualInMs);
      }
    }
  }

  return {
    totalPrincipal,
    totalCredited,
    totalLive,
    totalTodayAccrual,
    totalPeriodTarget,
    accrualPerSecond,
    activeCount,
    portfolioValue: totalPrincipal + totalLive,
    isAccruing,
    nextAccrualInMs: Number.isFinite(nextAccrualInMs) ? nextAccrualInMs : 0
  };
}

export function formatCountdownHms(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}

export function settlementFrequencyLabel(frequency: SettlementFrequency) {
  const map: Record<SettlementFrequency, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    maturity: "At maturity"
  };
  return map[frequency] ?? frequency;
}
