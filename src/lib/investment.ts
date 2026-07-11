import { proRataInterest, resolveAccrualPeriod } from "@/lib/investment/accrual-math";

export function makeInvestmentReference(userId: string) {
  const slice = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `INV-${slice}-${Date.now().toString(36).toUpperCase()}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export type SettlementFrequency = "daily" | "weekly" | "monthly" | "maturity";

export function settlementDates(
  start: Date,
  end: Date,
  frequency: SettlementFrequency,
  projectedDaily: number,
  principal: number,
  weeklyRoiBps?: number
): { date: Date; amount: number }[] {
  const schedule: { date: Date; amount: number }[] = [];

  if (frequency === "maturity") {
    const total = projectedDaily * Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    schedule.push({ date: end, amount: total });
    return schedule;
  }

  const stepDays = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 30;
  const fullAmount =
    frequency === "weekly" && weeklyRoiBps
      ? Math.round((principal * weeklyRoiBps) / 10_000)
      : frequency === "daily"
        ? projectedDaily
        : projectedDaily * stepDays;

  if (frequency === "weekly" && weeklyRoiBps) {
    let periodStart = new Date(start);
    let cursor = resolveAccrualPeriod({ startedAt: start, asOf: start }, "weekly").periodEnd;
    let guard = 0;

    while (cursor <= end && guard < 520) {
      const { periodStart: ps, periodEnd: pe } = resolveAccrualPeriod(
        {
          startedAt: start,
          lastWeeklySettlementAt: periodStart.getTime() === start.getTime() ? null : periodStart,
          asOf: cursor
        },
        "weekly"
      );
      const { accrued } = proRataInterest({
        principal,
        weeklyRoiBps,
        frequency: "weekly",
        periodStart: ps,
        periodEnd: pe,
        asOf: cursor
      });
      if (accrued > 0) schedule.push({ date: new Date(cursor), amount: accrued });
      periodStart = cursor;
      const next = resolveAccrualPeriod(
        { startedAt: start, lastWeeklySettlementAt: cursor, asOf: new Date(cursor.getTime() + 1000) },
        "weekly"
      ).periodEnd;
      if (next.getTime() <= cursor.getTime()) break;
      cursor = next;
      guard += 1;
    }
    return schedule;
  }

  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + stepDays);

  while (cursor <= end) {
    schedule.push({ date: new Date(cursor), amount: fullAmount });
    cursor.setDate(cursor.getDate() + stepDays);
  }

  return schedule;
}
