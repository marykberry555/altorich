import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type AdminMetrics = {
  members: number;
  activeInvestments: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalWalletBalance: number;
  depositsThisMonth: number;
  withdrawalsThisMonth: number;
  revenueEstimate: number;
  portfolioGrowth: { month: string; value: number }[];
  monthlyDeposits: { month: string; value: number }[];
  monthlyWithdrawals: { month: string; value: number }[];
  allocation: { name: string; value: number }[];
};

export class AnalyticsService {
  constructor(private readonly supabase: Client) {}

  async getAdminMetrics(): Promise<AdminMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: members },
      { count: activeInvestments },
      pendingDepositsRes,
      pendingWithdrawalsRes,
      depositsMonthRes,
      withdrawalsMonthRes,
      investmentsRes
    ] = await Promise.all([
      this.supabase.from("profiles").select("*", { count: "exact", head: true }),
      this.supabase.from("investments").select("*", { count: "exact", head: true }).eq("status", "active"),
      this.supabase.from("deposits").select("amount").eq("status", "pending"),
      this.supabase.from("withdrawals").select("id").eq("status", "pending"),
      this.supabase.from("deposits").select("amount, created_at").gte("created_at", monthStart).in("status", ["approved", "completed"]),
      this.supabase.from("withdrawals").select("amount, created_at").gte("created_at", monthStart).in("status", ["approved", "paid"]),
      this.supabase.from("investments").select("amount, status, total_earned, created_at").order("created_at", { ascending: false }).limit(500)
    ]);

    const pendingDeposits = (pendingDepositsRes.data ?? []).reduce((s, d) => s + Number(d.amount), 0);
    const pendingWithdrawals = pendingWithdrawalsRes.data?.length ?? 0;

    const { data: wallets } = await this.supabase.from("wallets").select("id");
    let totalWalletBalance = 0;
    if (wallets) {
      for (const w of wallets) {
        const { data: bal } = await this.supabase.rpc("wallet_balance", { p_wallet_id: w.id });
        totalWalletBalance += Number(bal ?? 0);
      }
    }

    const depositsThisMonth = (depositsMonthRes.data ?? []).reduce((s, d) => s + Number(d.amount), 0);
    const withdrawalsThisMonth = (withdrawalsMonthRes.data ?? []).reduce((s, d) => s + Number(d.amount), 0);

    const investments = investmentsRes.data ?? [];
    const totalInvested = investments
      .filter((i) => !["cancelled", "pending"].includes(i.status))
      .reduce((s, i) => s + Number(i.amount), 0);
    const totalEarned = investments.reduce((s, i) => s + Number(i.total_earned ?? 0), 0);

    const monthlyDeposits = await this.monthlyDepositTotals();
    const monthlyWithdrawals = await this.monthlyWithdrawalTotals();

    const portfolioGrowth = this.buildMonthlySeries(
      investments.map((i) => ({ date: i.created_at, value: Number(i.amount) }))
    );

    return {
      members: members ?? 0,
      activeInvestments: activeInvestments ?? 0,
      pendingDeposits,
      pendingWithdrawals,
      totalWalletBalance,
      depositsThisMonth,
      withdrawalsThisMonth,
      revenueEstimate: totalEarned,
      portfolioGrowth,
      monthlyDeposits,
      monthlyWithdrawals,
      allocation: [
        { name: "Wallet liquidity", value: totalWalletBalance },
        { name: "Invested", value: totalInvested },
        { name: "Earnings", value: totalEarned }
      ].filter((a) => a.value > 0)
    };
  }

  async getMemberAnalytics(userId: string) {
    const wallet = await this.supabase.from("wallets").select("id").eq("user_id", userId).maybeSingle();
    if (!wallet.data) {
      return {
        balanceHistory: [],
        earningsTrend: [],
        monthlyDeposits: [],
        monthlyWithdrawals: [],
        allocation: []
      };
    }

    const [txs, deposits, withdrawals, investments] = await Promise.all([
      this.supabase
        .from("wallet_transactions")
        .select("type, amount, reason, created_at, status")
        .eq("wallet_id", wallet.data.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(60),
      this.supabase.from("deposits").select("amount, created_at, status").eq("user_id", userId).in("status", ["approved", "completed"]),
      this.supabase.from("withdrawals").select("amount, created_at, status").eq("user_id", userId).in("status", ["approved", "paid"]),
      this.supabase.from("investments").select("amount, status, total_earned").eq("user_id", userId)
    ]);

    const transactions = txs.data ?? [];
    const { data: balanceData } = await this.supabase.rpc("wallet_balance", { p_wallet_id: wallet.data.id });
    const balance = Number(balanceData ?? 0);

    let running = balance;
    const balanceHistory = [...transactions].reverse().map((t) => {
      const point = {
        date: new Date(t.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        value: running
      };
      const amt = Number(t.amount);
      running -= t.type === "credit" ? amt : -amt;
      return point;
    }).slice(-12);

    const earningsTrend = transactions
      .filter((t) => t.type === "credit" && t.reason === "investment_settlement")
      .slice(0, 12)
      .reverse()
      .map((t) => ({
        date: new Date(t.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        value: Number(t.amount)
      }));

    const inv = investments.data ?? [];
    const totalInvested = inv.filter((i) => !["cancelled", "pending"].includes(i.status)).reduce((s, i) => s + Number(i.amount), 0);

    return {
      balanceHistory,
      earningsTrend,
      monthlyDeposits: this.buildMonthlySeries((deposits.data ?? []).map((d) => ({ date: d.created_at, value: Number(d.amount) }))),
      monthlyWithdrawals: this.buildMonthlySeries((withdrawals.data ?? []).map((d) => ({ date: d.created_at, value: Number(d.amount) }))),
      allocation: [
        { name: "Available", value: balance },
        { name: "Invested", value: totalInvested }
      ].filter((a) => a.value > 0)
    };
  }

  private buildMonthlySeries(items: { date: string; value: number }[]) {
    const map = new Map<string, number>();
    for (const item of items) {
      const d = new Date(item.date);
      const key = d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" });
      map.set(key, (map.get(key) ?? 0) + item.value);
    }
    return Array.from(map.entries())
      .slice(-6)
      .map(([month, value]) => ({ month, value }));
  }

  private async monthlyDepositTotals() {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    const { data } = await this.supabase
      .from("deposits")
      .select("amount, created_at")
      .gte("created_at", since.toISOString())
      .in("status", ["approved", "completed"]);

    return this.buildMonthlySeries((data ?? []).map((row) => ({
      date: String(row.created_at),
      value: Number(row.amount)
    })));
  }

  private async monthlyWithdrawalTotals() {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    const { data } = await this.supabase
      .from("withdrawals")
      .select("amount, created_at")
      .gte("created_at", since.toISOString())
      .in("status", ["approved", "paid"]);

    return this.buildMonthlySeries((data ?? []).map((row) => ({
      date: String(row.created_at),
      value: Number(row.amount)
    })));
  }
}
