import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { SettlementService } from "@/services/investment/settlement.service";
import { ReferralService } from "@/services/referral/referral.service";
import { addDays, makeInvestmentReference, type SettlementFrequency } from "@/lib/investment";
import { buildPlanDefaults, type CreatePlanInput } from "@/lib/packages/plan-defaults";
import { PLATFORM_EARNING, platformProjectedDaily } from "@/lib/earning/platform-earning";

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
    const normalized = slug.trim().toLowerCase();
    const candidates = normalized.startsWith("alto-")
      ? [normalized]
      : [`alto-${normalized}`, normalized];

    for (const candidate of candidates) {
      const { data, error } = await this.supabase
        .from("investment_plans")
        .select("*")
        .eq("slug", candidate)
        .eq("is_active", true)
        .eq("plan_status", "active")
        .maybeSingle();
      if (!error && data) return data;
    }
    return null;
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
      throw Errors.badRequest("This investment sector is not available.");
    }
  }

  /**
   * After funding approval: invest credited amount into the member's preferred package.
   * Skips quietly when no package is set or amount is below the plan minimum.
   */
  async autoInvestFromPreferredPackage(
    userId: string,
    amount: number,
    context?: { depositId?: string }
  ): Promise<Investment | null> {
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("preferred_package_slug")
      .eq("id", userId)
      .maybeSingle();

    const slug = profile?.preferred_package_slug?.trim();
    if (!slug) return null;

    const plan = await this.getPlanBySlug(slug);
    if (!plan) return null;

    const min = Number(plan.min_investment ?? plan.price);
    const max = Number(plan.max_investment ?? plan.price);
    if (amount < min) {
      await this.notifications.dispatch({
        userId,
        title: "Wallet funded — top up to invest",
        body: `${plan.name} needs at least ₦${min.toLocaleString("en-NG")}. Your funds are in your wallet.`,
        channel: "in_app",
        metadata: { preferred_package: slug, deposit_id: context?.depositId ?? null }
      });
      return null;
    }

    const investAmount = Math.min(amount, max);
    return this.purchasePlan(userId, plan.id, investAmount);
  }

  async purchasePlan(userId: string, planId: string, amount: number): Promise<Investment> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw Errors.notFound("Investment sector");

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
    // Unified platform earning engine — sector/plan never sets independent ROI.
    const weeklyRoiBps = PLATFORM_EARNING.weeklyRoiBps;
    const projectedDaily = platformProjectedDaily(amount);

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

  private async uniquePlanSlug(base: string) {
    let slug = base;
    let suffix = 2;
    while (true) {
      const { data } = await this.supabase.from("investment_plans").select("id").eq("slug", slug).maybeSingle();
      if (!data) return slug;
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
  }

  async createPlan(input: CreatePlanInput) {
    const defaults = buildPlanDefaults(input);
    const slug = await this.uniquePlanSlug(defaults.slugBase);

    return this.upsertPlan({
      slug,
      name: defaults.name,
      tier: defaults.tier,
      category: defaults.category,
      price: defaults.price,
      min_investment: defaults.min_investment,
      max_investment: defaults.max_investment,
      currency: defaults.currency,
      cycle_days: defaults.cycle_days,
      projected_daily: defaults.projected_daily,
      first_bonus: defaults.first_bonus,
      description: defaults.description,
      settlement_frequency: defaults.settlement_frequency,
      plan_status: defaults.plan_status,
      visibility: defaults.visibility,
      is_active: defaults.is_active,
      sort_order: defaults.sort_order,
      weekly_roi_bps: defaults.weekly_roi_bps,
      risk_disclosure: defaults.risk_disclosure
    } as Database["public"]["Tables"]["investment_plans"]["Insert"]);
  }

  async deletePlan(planId: string) {
    const { count, error: countError } = await this.supabase
      .from("investments")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", planId);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new AppError(
        "Cannot delete a sector that has investments. Archive it instead.",
        409,
        "PLAN_IN_USE"
      );
    }

    const { error } = await this.supabase.from("investment_plans").delete().eq("id", planId);
    if (error) throw error;
  }
}
