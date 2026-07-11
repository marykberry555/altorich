import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { SettlementService } from "@/services/investment/settlement.service";
import { ReferralService } from "@/services/referral/referral.service";
import { addDays, makeInvestmentReference, type SettlementFrequency } from "@/lib/investment";

type Client = SupabaseClient<Database>;
type InvestmentPlan = Database["public"]["Tables"]["investment_plans"]["Row"];
type Investment = Database["public"]["Tables"]["investments"]["Row"];

export type PortfolioSummary = {
  activeCount: number;
  completedCount: number;
  maturedCount: number;
  totalInvested: number;
  totalEarned: number;
  currentValue: number;
  upcomingMaturities: { id: string; reference: string | null; ends_at: string; amount: number }[];
};

export class InvestmentService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;
  private readonly settlements: SettlementService;
  private readonly referrals: ReferralService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
    this.settlements = new SettlementService(supabase);
    this.referrals = new ReferralService(supabase);
  }

  async listActivePlans() {
    const { data, error } = await this.supabase
      .from("investment_plans")
      .select("*")
      .eq("is_active", true)
      .eq("plan_status", "active")
      .in("visibility", ["public", "members"])
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async listAllPlans() {
    const { data, error } = await this.supabase
      .from("investment_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async getPlanBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from("investment_plans")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .eq("plan_status", "active")
      .single();

    if (error) return null;
    return data;
  }

  async getPlanById(planId: string) {
    const { data, error } = await this.supabase.from("investment_plans").select("*").eq("id", planId).single();
    if (error) return null;
    return data;
  }

  async listUserInvestments(userId: string) {
    const { data, error } = await this.supabase
      .from("investments")
      .select("*, investment_plans(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  validatePurchaseAmount(plan: InvestmentPlan, amount: number) {
    const min = Number(plan.min_investment ?? plan.price);
    const max = Number(plan.max_investment ?? plan.price);

    if (amount < min) {
      throw new AppError(`Minimum investment is ₦${min.toLocaleString("en-NG")}.`, 400, "BELOW_MINIMUM");
    }
    if (amount > max) {
      throw new AppError(`Maximum investment is ₦${max.toLocaleString("en-NG")}.`, 400, "ABOVE_MAXIMUM");
    }
    if (!plan.is_active || plan.plan_status !== "active") {
      throw Errors.badRequest("This plan is not available for purchase.");
    }
  }

  async purchasePlan(userId: string, planId: string, amount: number): Promise<Investment> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw Errors.notFound("Investment plan");

    this.validatePurchaseAmount(plan, amount);

    const reference = makeInvestmentReference(userId);
    const wallet = await this.wallet.getWalletByUserId(userId);
    const balance = await this.wallet.getBalance(wallet.id);

    if (balance < amount) {
      throw new AppError("Insufficient wallet balance.", 400, "INSUFFICIENT_BALANCE");
    }

    const startedAt = new Date();
    const endsAt = addDays(startedAt, plan.cycle_days);
    const frequency = (plan.settlement_frequency ?? "weekly") as SettlementFrequency;
    const weeklyRoiBps = Number((plan as InvestmentPlan & { weekly_roi_bps?: number }).weekly_roi_bps ?? 1000);
    const projectedDaily =
      Number(plan.projected_daily) > 0
        ? Number(plan.projected_daily)
        : Math.round(((amount * weeklyRoiBps) / 10_000 / 7) * 100) / 100;

    const { data: investment, error: invError } = await this.supabase
      .from("investments")
      .insert({
        user_id: userId,
        plan_id: planId,
        amount,
        status: "pending",
        reference,
        settlement_frequency: frequency,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        auto_reinvest: true,
        weekly_roi_bps: weeklyRoiBps
      } as Database["public"]["Tables"]["investments"]["Insert"])
      .select()
      .single();

    if (invError) {
      if (invError.code === "23505") {
        throw new AppError("Duplicate purchase detected.", 409, "DUPLICATE");
      }
      throw invError;
    }

    try {
      const tx = await this.wallet.debitInvestmentPurchase(wallet.id, amount, investment.id, reference);

      await this.supabase
        .from("investments")
        .update({
          status: "active",
          wallet_transaction_id: tx.id
        } as Database["public"]["Tables"]["investments"]["Update"])
        .eq("id", investment.id);

      await this.settlements.createScheduleForInvestment(
        investment.id,
        {
          projected_daily: projectedDaily,
          cycle_days: plan.cycle_days,
          settlement_frequency: frequency
        },
        amount,
        startedAt,
        endsAt,
        weeklyRoiBps
      );

      await this.notifications.notifyEvent("investment.purchased", userId, {
        amount,
        investment_id: investment.id,
        reference
      });

      try {
        await this.referrals.processFirstInvestmentActivated(
          userId,
          investment.id,
          amount,
          String(plan.tier ?? "starter")
        );
      } catch (referralErr) {
        console.error("Referral commission processing failed", referralErr);
      }

      const { data: active } = await this.supabase
        .from("investments")
        .select("*")
        .eq("id", investment.id)
        .single();

      return active!;
    } catch (err) {
      await this.supabase
        .from("investments")
        .update({ status: "cancelled" } as Database["public"]["Tables"]["investments"]["Update"])
        .eq("id", investment.id);
      throw err;
    }
  }

  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    const investments = await this.listUserInvestments(userId);
    const now = new Date();

    const active = investments.filter((i) => ["active", "stopping"].includes(i.status));
    const completed = investments.filter((i) => i.status === "completed" || i.status === "closed");
    const matured = investments.filter((i) => i.status === "matured");

    const totalInvested = investments
      .filter((i) => !["cancelled", "pending"].includes(i.status))
      .reduce((s, i) => s + Number(i.amount), 0);

    const totalEarned = investments.reduce((s, i) => s + Number(i.total_earned ?? 0), 0);

    const upcomingMaturities = active
      .filter((i) => new Date(i.ends_at) > now)
      .sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime())
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        reference: i.reference,
        ends_at: i.ends_at,
        amount: Number(i.amount)
      }));

    return {
      activeCount: active.length,
      completedCount: completed.length,
      maturedCount: matured.length,
      totalInvested,
      totalEarned,
      currentValue: totalInvested + totalEarned,
      upcomingMaturities
    };
  }

  async requestStop(investmentId: string, userId: string) {
    const { data: inv, error } = await this.supabase
      .from("investments")
      .select("*")
      .eq("id", investmentId)
      .eq("user_id", userId)
      .single();

    if (error || !inv) throw Errors.notFound("Investment");
    if (!["active", "stopping"].includes(inv.status)) {
      throw new AppError("Only active investments can be stopped.", 409, "INVALID_STATUS");
    }
    if ((inv as { stop_requested_at?: string | null }).stop_requested_at) {
      throw new AppError("Stop already requested. Earnings pay out on Monday 09:00 WAT.", 409, "ALREADY_STOPPING");
    }

    const { data, error: updateError } = await this.supabase
      .from("investments")
      .update({
        status: "stopping",
        stop_requested_at: new Date().toISOString()
      } as Database["public"]["Tables"]["investments"]["Update"])
      .eq("id", investmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    await this.notifications.dispatch({
      userId,
      title: "Stop investment scheduled",
      body: "Your earnings will be paid to your wallet on Monday at 09:00 WAT. You can then withdraw from your wallet.",
      channel: "in_app",
      metadata: { investment_id: investmentId }
    });

    return data;
  }

  async cancelInvestment(investmentId: string, userId: string, reason: string) {
    const { data: inv, error } = await this.supabase
      .from("investments")
      .select("*")
      .eq("id", investmentId)
      .eq("user_id", userId)
      .single();

    if (error || !inv) throw Errors.notFound("Investment");
    if (inv.status !== "pending") {
      throw new AppError("Only pending investments can be cancelled.", 409, "INVALID_STATUS");
    }

    const { data, error: updateError } = await this.supabase
      .from("investments")
      .update({
        status: "cancelled",
        closed_at: new Date().toISOString()
      } as Database["public"]["Tables"]["investments"]["Update"])
      .eq("id", investmentId)
      .select()
      .single();

    if (updateError) throw updateError;
    return data;
  }

  async upsertPlan(input: Database["public"]["Tables"]["investment_plans"]["Insert"]) {
    const { data, error } = await this.supabase
      .from("investment_plans")
      .upsert(input as Database["public"]["Tables"]["investment_plans"]["Insert"])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePlan(planId: string) {
    const { count, error: countError } = await this.supabase
      .from("investments")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", planId);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new AppError(
        "Cannot delete a package that has investments. Archive it instead.",
        409,
        "PLAN_IN_USE"
      );
    }

    const { error } = await this.supabase.from("investment_plans").delete().eq("id", planId);
    if (error) throw error;
  }
}
