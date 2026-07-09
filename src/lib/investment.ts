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
  principal: number
): { date: Date; amount: number }[] {
  const schedule: { date: Date; amount: number }[] = [];

  if (frequency === "maturity") {
    const total = projectedDaily * Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    schedule.push({ date: end, amount: total });
    return schedule;
  }

  const stepDays = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 30;
  const amount = frequency === "daily" ? projectedDaily : projectedDaily * stepDays;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + stepDays);

  while (cursor <= end) {
    schedule.push({ date: new Date(cursor), amount });
    cursor.setDate(cursor.getDate() + stepDays);
  }

  return schedule;
}
