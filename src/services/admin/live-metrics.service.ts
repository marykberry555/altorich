import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AnalyticsService } from "@/services/admin/analytics.service";

type Client = SupabaseClient<Database>;

export type AdminLiveMetrics = {
  onlineMembers: number;
  offlineMembers: number;
  newLoginsToday: number;
  todayNewMembers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  investmentsToday: number;
  investmentsTodayAmount: number;
  todayDeposits: number;
  todayDepositsAmount: number;
  todayWithdrawals: number;
  todayWithdrawalsAmount: number;
  revenueToday: number;
  payoutsToday: number;
  members: number;
  activeInvestments: number;
  totalWalletBalance: number;
  platformAssets: number;
  monthlyRevenue: number;
  depositsThisMonth: number;
  withdrawalsThisMonth: number;
  /** Operational intelligence (read-only aggregates) */
  pendingDepositReviews: number;
  activeMembers30d: number;
  emailVerificationsToday: number;
  referralActivityToday: number;
  welcomeBonusAllocations: number;
  settlementQueueSize: number;
  supportItemsOpen: number;
  yesterdayDepositsAmount: number;
  yesterdayWithdrawalsAmount: number;
  yesterdayNewMembers: number;
};

export class LiveMetricsService {
  private analytics: AnalyticsService;

  constructor(private readonly supabase: Client) {
    this.analytics = new AnalyticsService(supabase);
  }

  async getLiveMetrics(): Promise<AdminLiveMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const activeSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const onlineSince = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

    const [
      base,
      onlineRes,
      loginsTodayRes,
      newMembersTodayRes,
      newMembersYesterdayRes,
      investmentsTodayRes,
      depositsTodayRes,
      depositsYesterdayRes,
      withdrawalsTodayRes,
      withdrawalsYesterdayRes,
      settlementsTodayRes,
      payoutsTodayRes,
      pendingKycRes,
      activeInvestmentsSumRes,
      pendingDepositCountRes,
      activeMembersRes,
      emailVerifiedTodayRes,
      referralsTodayRes,
      welcomeBonusAllocRes,
      scheduledWithdrawalsRes,
      supportNotifRes
    ] = await Promise.all([
      this.analytics.getAdminMetrics(),
      this.supabase.from("login_activity").select("user_id").gte("created_at", onlineSince),
      this.supabase.from("login_activity").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      this.supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      this.supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStart)
        .lt("created_at", todayStart),
      this.supabase.from("investments").select("amount").gte("created_at", todayStart),
      this.supabase
        .from("deposits")
        .select("amount")
        .gte("created_at", todayStart)
        .in("status", ["approved", "completed", "pending"]),
      this.supabase
        .from("deposits")
        .select("amount")
        .gte("created_at", yesterdayStart)
        .lt("created_at", todayStart)
        .in("status", ["approved", "completed", "pending"]),
      this.supabase
        .from("withdrawals")
        .select("amount")
        .gte("created_at", todayStart)
        .in("status", ["pending", "approved", "paid", "scheduled"]),
      this.supabase
        .from("withdrawals")
        .select("amount")
        .gte("created_at", yesterdayStart)
        .lt("created_at", todayStart)
        .in("status", ["pending", "approved", "paid", "scheduled"]),
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
        .gte("created_at", todayStart),
      this.supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("kyc_status", ["pending", "requires_update"]),
      this.supabase.from("investments").select("amount").eq("status", "active"),
      this.supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
      this.supabase.from("login_activity").select("user_id").gte("created_at", activeSince),
      this.supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("email_verified_at", todayStart),
      this.supabase.from("referrals").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      // welcome_bonuses table exists at runtime; types may lag migrations
      (this.supabase as SupabaseClient<Record<string, unknown>>)
        .from("welcome_bonuses")
        .select("*", { count: "exact", head: true }),
      this.supabase.from("withdrawals").select("id").in("status", ["pending", "scheduled", "approved"]),
      this.supabase.from("admin_notifications").select("*", { count: "exact", head: true }).is("read_at", null)
    ]);

    const onlineMembers = new Set((onlineRes.data ?? []).map((r) => r.user_id)).size;
    const members = base.members;
    const investmentsToday = investmentsTodayRes.data ?? [];
    const investmentsTodayAmount = investmentsToday.reduce((s, r) => s + Number(r.amount), 0);
    const todayDeposits = depositsTodayRes.data ?? [];
    const todayDepositsAmount = todayDeposits.reduce((s, r) => s + Number(r.amount), 0);
    const todayWithdrawals = withdrawalsTodayRes.data ?? [];
    const todayWithdrawalsAmount = todayWithdrawals.reduce((s, r) => s + Number(r.amount), 0);
    const revenueToday = (settlementsTodayRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const payoutsToday = (payoutsTodayRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const activeInvested = (activeInvestmentsSumRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const platformAssets = base.totalWalletBalance + activeInvested;

    const yesterdayDeposits = depositsYesterdayRes.data ?? [];
    const yesterdayWithdrawals = withdrawalsYesterdayRes.data ?? [];
    const yesterdayDepositsAmount = yesterdayDeposits.reduce((s, r) => s + Number(r.amount), 0);
    const yesterdayWithdrawalsAmount = yesterdayWithdrawals.reduce((s, r) => s + Number(r.amount), 0);
    const yesterdayNewMembers = newMembersYesterdayRes.count ?? 0;

    const activeMembers30d = new Set((activeMembersRes.data ?? []).map((r) => r.user_id)).size;
    const settlementQueueSize = scheduledWithdrawalsRes.data?.length ?? base.pendingWithdrawals;

    return {
      onlineMembers,
      offlineMembers: Math.max(0, members - onlineMembers),
      newLoginsToday: loginsTodayRes.count ?? 0,
      todayNewMembers: newMembersTodayRes.count ?? 0,
      pendingDeposits: base.pendingDeposits,
      pendingWithdrawals: base.pendingWithdrawals,
      pendingKyc: pendingKycRes.count ?? 0,
      investmentsToday: investmentsToday.length,
      investmentsTodayAmount,
      todayDeposits: todayDeposits.length,
      todayDepositsAmount,
      todayWithdrawals: todayWithdrawals.length,
      todayWithdrawalsAmount,
      revenueToday,
      payoutsToday,
      members,
      activeInvestments: base.activeInvestments,
      totalWalletBalance: base.totalWalletBalance,
      platformAssets,
      monthlyRevenue: base.depositsThisMonth,
      depositsThisMonth: base.depositsThisMonth,
      withdrawalsThisMonth: base.withdrawalsThisMonth,
      pendingDepositReviews: pendingDepositCountRes.count ?? 0,
      activeMembers30d,
      emailVerificationsToday: emailVerifiedTodayRes.count ?? 0,
      referralActivityToday: referralsTodayRes.count ?? 0,
      welcomeBonusAllocations: welcomeBonusAllocRes.count ?? 0,
      settlementQueueSize,
      supportItemsOpen: supportNotifRes.count ?? 0,
      yesterdayDepositsAmount,
      yesterdayWithdrawalsAmount,
      yesterdayNewMembers
    };
  }
}
