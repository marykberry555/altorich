import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { WalletService } from "@/services/wallet/wallet.service";
import { DepositService } from "@/services/deposit/deposit.service";
import { NotificationService } from "@/services/notification/notification.service";
import { InvestmentService } from "@/services/investment/investment.service";

type Client = SupabaseClient<Database>;

export type MemberDashboardData = {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  balance: number;
  pendingDeposits: number;
  activeInvestments: number;
  portfolio: Awaited<ReturnType<InvestmentService["getPortfolioSummary"]>>;
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
    const [profileResult, announcement, depositStats, unreadNotifications, portfolio] = await Promise.all([
      this.supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      this.settings.getAnnouncement(),
      this.deposits.getUserStats(userId),
      this.notifications.getUnreadCount(userId),
      this.investments.getPortfolioSummary(userId)
    ]);

    const profile = profileResult.data;
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
    } catch {
      // Wallet may not exist yet
    }

    const recentDeposits = await this.deposits.listForUser(userId, 5);

    const referralResult = await this.supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId);

    return {
      profile,
      balance,
      pendingDeposits: depositStats.pending,
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
