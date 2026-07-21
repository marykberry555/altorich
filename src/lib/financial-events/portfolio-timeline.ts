import type { Deposit, Investment, Withdrawal } from "@/types/database";
import type { FinancialTimelineEvent } from "./types";

type SettlementTx = {
  id: string;
  amount: number;
  created_at: string;
  reason: string;
};

export function buildPortfolioTimeline(input: {
  deposits?: Deposit[];
  investments?: Investment[];
  withdrawals?: Withdrawal[];
  settlements?: SettlementTx[];
  limit?: number;
}): FinancialTimelineEvent[] {
  const events: FinancialTimelineEvent[] = [];

  for (const d of input.deposits ?? []) {
    if (d.status === "approved" || d.status === "completed") {
      events.push({
        id: `pf-deposit-${d.id}`,
        kind: "deposit",
        title: "Deposit",
        description: "Capital entered your account.",
        reference: d.reference,
        timestamp: d.reviewed_at ?? d.created_at,
        amount: Number(d.amount)
      });
    }
  }

  for (const inv of input.investments ?? []) {
    events.push({
      id: `pf-inv-${inv.id}`,
      kind: "investment",
      title: inv.status === "active" ? "Investment Started" : "Investment Updated",
      description: `Sector investment · ${inv.status}`,
      reference: inv.reference,
      timestamp: inv.started_at ?? inv.created_at,
      amount: Number(inv.amount),
      href: `/investments/${inv.id}`
    });
  }

  for (const s of input.settlements ?? []) {
    events.push({
      id: `pf-settle-${s.id}`,
      kind: "settlement",
      title: s.reason.includes("weekly") ? "Weekly Settlement" : "Daily Earnings",
      description: "Earnings credited to your wallet.",
      timestamp: s.created_at,
      amount: Number(s.amount),
      href: "/wallet"
    });
  }

  for (const w of input.withdrawals ?? []) {
    if (w.status === "paid") {
      events.push({
        id: `pf-withdraw-${w.id}`,
        kind: "withdrawal",
        title: "Withdrawal",
        description: "Capital returned to your bank.",
        reference: w.settlement_reference,
        timestamp: w.paid_at ?? w.created_at,
        amount: Number(w.amount),
        href: "/withdrawals"
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, input.limit ?? 40);
}
