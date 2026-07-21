import { formatNaira } from "@/lib/domain";
import type { InsightMetric } from "./types";

type MonthlyPoint = { month: string; value: number };

function currentAndPreviousMonth(series: MonthlyPoint[]): { current: number; previous: number | null } {
  if (series.length === 0) return { current: 0, previous: null };
  const sorted = [...series].sort((a, b) => a.month.localeCompare(b.month));
  const current = sorted[sorted.length - 1]?.value ?? 0;
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2]?.value ?? null : null;
  return { current, previous };
}

function buildComparison(current: number, previous: number | null): InsightMetric["comparison"] {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) {
    return { label: "Compared with last month", direction: "flat", value: "No change" };
  }
  const pct = previous === 0 ? null : Math.round((diff / previous) * 100);
  const direction = diff > 0 ? "up" : "down";
  const value =
    pct !== null ? `${diff > 0 ? "+" : ""}${pct}%` : `${diff > 0 ? "+" : ""}${formatNaira(Math.abs(diff))}`;
  return { label: "Compared with last month", direction, value };
}

export function buildMemberInsights(input: {
  totalEarned: number;
  portfolioValue: number;
  monthlyDeposits: MonthlyPoint[];
  monthlyWithdrawals: MonthlyPoint[];
  referralCount: number;
  verifiedReferrals: number;
  earningsTrend: { date: string; value: number }[];
}): InsightMetric[] {
  const depositMonths = currentAndPreviousMonth(input.monthlyDeposits);
  const withdrawalMonths = currentAndPreviousMonth(input.monthlyWithdrawals);

  const thisMonthEarnings = input.earningsTrend
    .filter((p) => {
      const d = new Date(p.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, p) => s + p.value, 0);

  const metrics: InsightMetric[] = [
    {
      id: "portfolio_growth",
      label: "Portfolio value",
      value: formatNaira(input.portfolioValue),
      comparison: null
    },
    {
      id: "total_earnings",
      label: "Total earnings",
      value: formatNaira(input.totalEarned),
      comparison: thisMonthEarnings > 0 ? { label: "This month", direction: "up", value: formatNaira(thisMonthEarnings) } : null
    },
    {
      id: "deposits",
      label: "Deposits this month",
      value: formatNaira(depositMonths.current),
      comparison: buildComparison(depositMonths.current, depositMonths.previous)
    },
    {
      id: "withdrawals",
      label: "Withdrawals this month",
      value: formatNaira(withdrawalMonths.current),
      comparison: buildComparison(withdrawalMonths.current, withdrawalMonths.previous)
    },
    {
      id: "referrals",
      label: "Referral progress",
      value: `${input.verifiedReferrals} verified · ${input.referralCount} total`,
      comparison: null
    }
  ];

  return metrics.filter((m) => m.value !== formatNaira(0) || m.id === "referrals" || m.id === "portfolio_growth");
}
