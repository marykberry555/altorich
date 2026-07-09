export type ChartPoint = { date: string; value: number; label?: string };
export type AllocationPoint = { name: string; value: number };

type Tx = { type: string; amount: number; created_at: string; reason: string };

export function buildBalanceHistory(transactions: Tx[], currentBalance: number): ChartPoint[] {
  if (transactions.length === 0) return [];

  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let running = currentBalance;
  const points: ChartPoint[] = [];

  for (let i = sorted.length - 1; i >= 0; i--) {
    const tx = sorted[i];
    const amount = Number(tx.amount);
    points.unshift({
      date: new Date(tx.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
      value: running,
      label: tx.reason.replace(/_/g, " ")
    });
    running -= tx.type === "credit" ? amount : -amount;
  }

  return points.slice(-12);
}

export function buildEarningsTrend(transactions: Tx[]): ChartPoint[] {
  const earnings = transactions
    .filter((t) => t.type === "credit" && t.reason === "investment_settlement")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-12);

  return earnings.map((t) => ({
    date: new Date(t.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    value: Number(t.amount)
  }));
}

export function buildAllocation(input: {
  balance: number;
  totalInvested: number;
  pendingDeposits: number;
}): AllocationPoint[] {
  const points: AllocationPoint[] = [];
  if (input.balance > 0) points.push({ name: "Available", value: input.balance });
  if (input.totalInvested > 0) points.push({ name: "Invested", value: input.totalInvested });
  if (input.pendingDeposits > 0) points.push({ name: "Pending", value: input.pendingDeposits });
  return points;
}
