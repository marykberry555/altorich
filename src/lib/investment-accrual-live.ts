import type { SettlementFrequency } from "@/lib/investment";

export type LiveAccrualInput = {
  status: string;
  principalAmount: number;
  creditedTotal: number;
  projectedDaily: number;
  settlementFrequency: SettlementFrequency;
  startedAt: string | Date | null;
  endsAt: string | Date | null;
  lastSettlementAt?: string | Date | null;
};

export type LiveAccrualState = {
  creditedTotal: number;
  liveTotal: number;
  todayAccrual: number;
  periodEarnings: number;
  dayProgressPercent: number;
  nextAccrualInMs: number;
  isAccruing: boolean;
  nextSettlementAt: Date | null;
};

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function periodDays(frequency: SettlementFrequency): number {
  if (frequency === "weekly") return 7;
  if (frequency === "monthly") return 30;
  if (frequency === "maturity") return 1;
  return 1;
}

function periodAmount(projectedDaily: number, frequency: SettlementFrequency): number {
  const step = periodDays(frequency);
  return projectedDaily * step;
}

export function calculateLiveAccrualState(input: LiveAccrualInput, now: Date = new Date()): LiveAccrualState {
  const principal = input.principalAmount;
  const creditedTotal = input.creditedTotal;
  const startedAt = toDate(input.startedAt);
  const endsAt = toDate(input.endsAt);
  const lastSettlementAt = toDate(input.lastSettlementAt);
  const frequency = input.settlementFrequency ?? "daily";
  const earnings = periodAmount(input.projectedDaily, frequency);
  const stepMs = periodDays(frequency) * 86400000;

  const inactive =
    input.status !== "active" || !startedAt || (endsAt && now >= endsAt) || principal <= 0;

  if (inactive) {
    return {
      creditedTotal,
      liveTotal: creditedTotal,
      todayAccrual: 0,
      periodEarnings: earnings,
      dayProgressPercent: 0,
      nextAccrualInMs: 0,
      isAccruing: false,
      nextSettlementAt: null
    };
  }

  const periodStart = lastSettlementAt ?? startedAt;
  const periodEnd = new Date(periodStart.getTime() + stepMs);
  const cappedEnd = endsAt && periodEnd > endsAt ? endsAt : periodEnd;
  const periodMs = Math.max(1, cappedEnd.getTime() - periodStart.getTime());
  const elapsedMs = Math.min(Math.max(0, now.getTime() - periodStart.getTime()), periodMs);
  const progress = elapsedMs / periodMs;
  const todayAccrual = earnings * progress;
  const liveTotal = creditedTotal + todayAccrual;

  return {
    creditedTotal,
    liveTotal,
    todayAccrual,
    periodEarnings: earnings,
    dayProgressPercent: Math.round(progress * 100),
    nextAccrualInMs: Math.max(0, cappedEnd.getTime() - now.getTime()),
    isAccruing: progress < 1 && (!endsAt || now < endsAt),
    nextSettlementAt: cappedEnd
  };
}

export type LiveEarningsAggregate = {
  totalPrincipal: number;
  totalCredited: number;
  totalLive: number;
  totalTodayAccrual: number;
  totalPeriodTarget: number;
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
  let activeCount = 0;
  let isAccruing = false;
  let nextAccrualInMs = Number.POSITIVE_INFINITY;

  for (const inv of investments) {
    const state = calculateLiveAccrualState(inv, now);
    totalPrincipal += inv.principalAmount;
    totalCredited += state.creditedTotal;
    totalLive += state.liveTotal;
    totalTodayAccrual += state.todayAccrual;
    if (inv.status === "active") {
      activeCount += 1;
      totalPeriodTarget += state.periodEarnings;
      if (state.isAccruing) {
        isAccruing = true;
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
    activeCount,
    portfolioValue: totalPrincipal + totalLive,
    isAccruing,
    nextAccrualInMs: Number.isFinite(nextAccrualInMs) ? nextAccrualInMs : 0
  };
}

export function formatCountdownHms(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
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
