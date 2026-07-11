import { projectedDailyForPrincipal } from "@/lib/packages/tier-config";
import type { SettlementFrequency } from "@/lib/investment";
import type { ActiveInvestmentRow } from "@/components/investment/ActiveInvestmentCard";
import type { LiveInvestmentInput } from "@/components/investment/LivePortfolioPanel";

type InvestmentWithPlan = {
  id: string;
  reference: string | null;
  amount: number;
  status: string;
  total_earned: number | null;
  started_at: string;
  ends_at: string;
  settlement_frequency: SettlementFrequency | null;
  weekly_roi_bps?: number | null;
  last_weekly_settlement_at?: string | null;
  investment_plans?: {
    name?: string;
    projected_daily?: number;
    settlement_frequency?: SettlementFrequency | null;
    weekly_roi_bps?: number | null;
  } | null;
};

type SettlementRow = {
  investment_id: string;
  settled_at: string | null;
  status: string;
};

export function mapInvestmentRows(
  investments: InvestmentWithPlan[],
  settlements: SettlementRow[] = []
): ActiveInvestmentRow[] {
  const lastPaid = new Map<string, string>();
  for (const s of settlements) {
    if (s.status !== "paid" || !s.settled_at) continue;
    const prev = lastPaid.get(s.investment_id);
    if (!prev || s.settled_at > prev) lastPaid.set(s.investment_id, s.settled_at);
  }

  return investments.map((inv) => {
    const plan = inv.investment_plans;
    const frequency = (inv.settlement_frequency ?? plan?.settlement_frequency ?? "weekly") as SettlementFrequency;
    const weeklyRoiBps = Number(inv.weekly_roi_bps ?? plan?.weekly_roi_bps ?? 1000);
    const amount = Number(inv.amount);
    const projectedDaily =
      Number(plan?.projected_daily ?? 0) > 0
        ? Number(plan?.projected_daily)
        : projectedDailyForPrincipal(amount, weeklyRoiBps);

    return {
      id: inv.id,
      reference: inv.reference,
      planName: plan?.name ?? "Investment",
      amount,
      totalEarned: Number(inv.total_earned ?? 0),
      status: inv.status,
      startedAt: inv.started_at,
      endsAt: inv.ends_at,
      projectedDaily,
      weeklyRoiBps,
      settlementFrequency: frequency,
      lastSettlementAt: lastPaid.get(inv.id) ?? inv.last_weekly_settlement_at ?? null,
      lastWeeklySettlementAt: inv.last_weekly_settlement_at ?? lastPaid.get(inv.id) ?? null
    };
  });
}

export function mapLiveInputs(rows: ActiveInvestmentRow[]): LiveInvestmentInput[] {
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    amount: r.amount,
    totalEarned: r.totalEarned,
    projectedDaily: r.projectedDaily,
    weeklyRoiBps: r.weeklyRoiBps,
    settlementFrequency: r.settlementFrequency,
    startedAt: r.startedAt,
    endsAt: r.endsAt,
    lastSettlementAt: r.lastSettlementAt,
    lastWeeklySettlementAt: r.lastWeeklySettlementAt
  }));
}

export async function fetchInvestmentContext(
  services: NonNullable<Awaited<ReturnType<typeof import("@/lib/services").getUserServices>>>,
  userId: string
) {
  const investments = await services.investments.listUserInvestments(userId);
  const ids = investments.map((i) => i.id);
  let settlements: SettlementRow[] = [];
  if (ids.length > 0) {
    const { data } = await services.supabase
      .from("investment_settlements")
      .select("investment_id, settled_at, status")
      .in("investment_id", ids)
      .eq("status", "paid");
    settlements = (data ?? []) as SettlementRow[];
  }

  const rows = mapInvestmentRows(investments as InvestmentWithPlan[], settlements);
  const wallet = await services.wallet.getWalletByUserId(userId).catch(() => null);
  const balance = wallet ? await services.wallet.getBalance(wallet.id) : 0;

  return { investments, rows, liveInputs: mapLiveInputs(rows), balance };
}
