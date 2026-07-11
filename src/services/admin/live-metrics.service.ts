import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AnalyticsService } from "@/services/admin/analytics.service";

type Client = SupabaseClient<Database>;

export type AdminLiveMetrics = {
  onlineMembers: number;
  newLoginsToday: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  investmentsToday: number;
  investmentsTodayAmount: number;
  revenueToday: number;
  payoutsToday: number;
  members: number;
  activeInvestments: number;
  totalWalletBalance: number;
  depositsThisMonth: number;
  withdrawalsThisMonth: number;
};

export class LiveMetricsService {
  private analytics: AnalyticsService;

  constructor(private readonly supabase: Client) {
    this.analytics = new AnalyticsService(supabase);
  }

  async getLiveMetrics(): Promise<AdminLiveMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const onlineSince = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

    const [base, onlineRes, loginsTodayRes, investmentsTodayRes, settlementsTodayRes, payoutsTodayRes] =
      await Promise.all([
        this.analytics.getAdminMetrics(),
        this.supabase
          .from("login_activity")
          .select("user_id")
          .gte("created_at", onlineSince),
        this.supabase
          .from("login_activity")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart),
        this.supabase
          .from("investments")
          .select("amount")
          .gte("created_at", todayStart),
        this.supabase
          .from("wallet_transactions")
          .select("amount")
          .eq("type", "credit")
          .eq("reason", "investment_settlement")
          .eq("status", "completed")
          .gte("created_at", todayStart),
        this.supabase
          .from("withdrawals")
          .select("amount")
          .in("status", ["approved", "paid"])
          .gte("created_at", todayStart)
      ]);

    const onlineMembers = new Set((onlineRes.data ?? []).map((r) => r.user_id)).size;
    const investmentsToday = investmentsTodayRes.data ?? [];
    const investmentsTodayAmount = investmentsToday.reduce((s, r) => s + Number(r.amount), 0);
    const revenueToday = (settlementsTodayRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const payoutsToday = (payoutsTodayRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

    return {
      onlineMembers,
      newLoginsToday: loginsTodayRes.count ?? 0,
      pendingDeposits: base.pendingDeposits,
      pendingWithdrawals: base.pendingWithdrawals,
      investmentsToday: investmentsToday.length,
      investmentsTodayAmount,
      revenueToday,
      payoutsToday,
      members: base.members,
      activeInvestments: base.activeInvestments,
      totalWalletBalance: base.totalWalletBalance,
      depositsThisMonth: base.depositsThisMonth,
      withdrawalsThisMonth: base.withdrawalsThisMonth
    };
  }
}
