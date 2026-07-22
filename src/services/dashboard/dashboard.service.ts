import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { logQueryFailure } from "@/lib/supabase/safe-query";
import { WalletService } from "@/services/wallet/wallet.service";
import { DepositService } from "@/services/deposit/deposit.service";
import { NotificationService } from "@/services/notification/notification.service";
import {
  InvestmentService,
  type PortfolioSummary
} from "@/services/investment/investment.service";

type Client = SupabaseClient<Database>;

const EMPTY_PORTFOLIO: PortfolioSummary = {
  activeCount: 0,
  completedCount: 0,
  maturedCount: 0,
  totalInvested: 0,
  totalEarned: 0,
  currentValue: 0,
  upcomingMaturities: []
};

export type MemberDashboardData = {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  balance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeInvestments: number;
  portfolio: PortfolioSummary;
  referralCount: number;
  unreadNotifications: number;
  recentTransactions: Awaited<ReturnType<WalletService["getTransactions"]>>;
  recentEarnings: { amount: number; created_at: string; reason: string }[];
  upcomingMaturities: { id: string; reference: string | null; ends_at: string; amount: number }[];
  recentDeposits: Awaited<ReturnType<DepositService["listForUser"]>>;
  announcement: string;
};

export class DashboardService {
  private readonly wallet: WalletService;
  private readonly deposits: DepositService;
  private readonly notifications: NotificationService;
  private readonly investments: InvestmentService;

  constructor(
    private readonly supabase: Client,
    private readonly settings: { getAnnouncement: () => Promise<string> }
  ) {
    this.wallet = new WalletService(supabase);
    this.deposits = new DepositService(supabase);
    this.notifications = new NotificationService(supabase);
    this.investments = new InvestmentService(supabase);
  }

  async getMemberDashboard(userId: string): Promise<MemberDashboardData> {
    const baseContext = {
      route: "/dashboard",
      component: "DashboardService",
      userId
    };

    const profileResult = await this.supabase
      .from("profiles")
      .select(
        "id, username, full_name, phone, avatar_url, preferred_package_slug, location_state_code, location_city_area, account_status, vip_level, invite_code, referred_by, email_verified_at, must_change_pin, must_change_password, notification_preferences, auto_weekly_payout, created_at, updated_at"
      )
      .eq("id", userId)
      .maybeSingle();
    if (profileResult.error) {
      logQueryFailure({ ...baseContext, fn: "profiles.select" }, profileResult.error);
    }

    const [announcement, depositStats, unreadNotifications, portfolio] = await Promise.all([
      this.settings.getAnnouncement().catch((error) => {
        logQueryFailure({ ...baseContext, fn: "getAnnouncement" }, error);
        return "";
      }),
      this.deposits.getUserStats(userId).catch((error) => {
        logQueryFailure({ ...baseContext, fn: "getUserStats" }, error);
        return { approved: 0, pending: 0, count: 0 };
      }),
      this.notifications.getUnreadCount(userId).catch((error) => {
        logQueryFailure({ ...baseContext, fn: "getUnreadCount" }, error);
        return 0;
      }),
      this.investments.getPortfolioSummary(userId).catch((error) => {
        logQueryFailure({ ...baseContext, fn: "getPortfolioSummary" }, error);
        return EMPTY_PORTFOLIO;
      })
    ]);

    const profile = profileResult.data ?? null;
    let balance = 0;
    let recentTransactions: MemberDashboardData["recentTransactions"] = [];
    let recentEarnings: MemberDashboardData["recentEarnings"] = [];

    try {
      const wallet = await this.wallet.getWalletByUserId(userId);
      balance = await this.wallet.getBalance(wallet.id);
      const txs = await this.wallet.getTransactions(wallet.id, 10);
      recentTransactions = txs.slice(0, 5);
      recentEarnings = txs
        .filter((t) => t.reason === "investment_settlement" && t.type === "credit")
        .slice(0, 5)
        .map((t) => ({
          amount: Number(t.amount),
          created_at: t.created_at,
          reason: t.reason
        }));
    } catch (error) {
      logQueryFailure({ ...baseContext, fn: "wallet" }, error);
    }

    const recentDeposits = await this.deposits.listForUser(userId, 5).catch((error) => {
      logQueryFailure({ ...baseContext, fn: "listForUser(deposits)" }, error);
      return [];
    });

    const [referralResult, pendingWithdrawalsResult] = await Promise.all([
      this.supabase.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", userId),
      this.supabase
        .from("withdrawals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending")
    ]);

    if (referralResult.error) {
      logQueryFailure({ ...baseContext, fn: "referrals.count" }, referralResult.error);
    }
    if (pendingWithdrawalsResult.error) {
      logQueryFailure({ ...baseContext, fn: "withdrawals.count" }, pendingWithdrawalsResult.error);
    }

    return {
      profile: profile as Database["public"]["Tables"]["profiles"]["Row"] | null,
      balance,
      pendingDeposits: depositStats.pending,
      pendingWithdrawals: pendingWithdrawalsResult.count ?? 0,
      activeInvestments: portfolio.activeCount,
      portfolio,
      referralCount: referralResult.count ?? 0,
      unreadNotifications,
      recentTransactions,
      recentEarnings,
      upcomingMaturities: portfolio.upcomingMaturities,
      recentDeposits,
      announcement
    };
  }
}
