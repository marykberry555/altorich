import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { SettlementService } from "@/services/investment/settlement.service";
import { ReferralService } from "@/services/referral/referral.service";
import { addDays, makeInvestmentReference, type SettlementFrequency } from "@/lib/investment";
import { buildPlanDefaults, type CreatePlanInput } from "@/lib/packages/plan-defaults";
import { platformProjectedDaily } from "@/lib/earning/platform-earning";
import {
  getPortfolioByInvestmentAmount,
  getPortfolioWeeklyRoiBps,
  isPortfolioSlug,
  resolveWeeklyRoiBps,
  validateInvestmentAmount,
  type PortfolioSlug
} from "@/config/investment-portfolios";
import {
  assertDepositInvestReconciliation,
  isLegacyCapHealing,
  LEGACY_CAP_HEALING_MESSAGE
} from "@/lib/finance/reconciliation";
import { logger } from "@/lib/logger";

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

    if (amount < min) {
      throw new AppError(`Minimum investment is ₦${min.toLocaleString("en-NG")}.`, 400, "BELOW_MINIMUM");
    }

    const tier = plan.tier as PortfolioSlug | null;
    if (tier && isPortfolioSlug(tier)) {
      const validation = validateInvestmentAmount(tier, amount);
      if (!validation.ok) {
        throw new AppError(validation.message, 400, validation.code);
      }
    }

    if (!plan.is_active || plan.plan_status !== "active") {
      throw Errors.badRequest("This investment portfolio is not available.");
    }
  }

  /**
   * After any wallet funding credit: invest the member's full available NGN balance
   * into the portfolio that matches the amount (preferred package used when it still fits).
   * Accrual starts immediately via purchasePlan started_at + settlement schedule.
   */
  async autoInvestFromPreferredPackage(
    userId: string,
    creditedAmount: number,
    context?: { depositId?: string; walletBefore?: number; source?: string }
  ): Promise<Investment | null> {
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("preferred_package_slug")
      .eq("id", userId)
      .maybeSingle();

    const preferredSlug = profile?.preferred_package_slug?.trim() ?? "";
    const wallet = await this.wallet.getWalletByUserId(userId);
    const balance = await this.wallet.getBalance(wallet.id);
    const walletBefore = context?.walletBefore ?? Math.max(0, balance - creditedAmount);

    const leaveInWallet = async (title: string, body: string, meta: Record<string, unknown> = {}) => {
      if (context?.walletBefore != null || creditedAmount > 0) {
        assertDepositInvestReconciliation({
          walletBefore,
          depositAmount: creditedAmount,
          investedAmount: 0,
          walletAfter: balance
        });
      }
      await this.notifications.dispatch({
        userId,
        title,
        body,
        channel: "in_app",
        metadata: {
          preferred_package: preferredSlug || null,
          deposit_id: context?.depositId ?? null,
          source: context?.source ?? null,
          ...meta
        }
      });
      return null;
    };

    if (balance <= 0) {
      return null;
    }

    // Prefer the member's chosen package when the balance still fits its range;
    // otherwise match the portfolio configured for this amount.
    let matchedSlug: PortfolioSlug | null = null;
    if (preferredSlug && isPortfolioSlug(preferredSlug)) {
      const preferredOk = validateInvestmentAmount(preferredSlug, balance);
      if (preferredOk.ok) matchedSlug = preferredSlug;
    }
    if (!matchedSlug) {
      matchedSlug = getPortfolioByInvestmentAmount(balance)?.slug ?? null;
    }

    if (!matchedSlug) {
      return leaveInWallet(
        "Wallet funded — amount outside portfolio ranges",
        `₦${balance.toLocaleString("en-NG")} does not match an active investment portfolio range. Funds remain in your wallet.`,
        { balance }
      );
    }

    const plan = await this.getPlanBySlug(matchedSlug);
    if (!plan || !plan.is_active || plan.plan_status !== "active") {
      return leaveInWallet(
        "Wallet funded — portfolio unavailable",
        `No active ${matchedSlug} portfolio is available for auto-invest. Funds remain in your wallet.`,
        { matched_slug: matchedSlug }
      );
    }

    const validation = validateInvestmentAmount(matchedSlug, balance);
    if (!validation.ok) {
      return leaveInWallet(
        validation.code === "BELOW_MINIMUM" ? "Wallet funded — top up to invest" : "Wallet funded — amount above portfolio range",
        `${plan.name}: ${validation.message} Your funds are in your wallet.`,
        { matched_slug: matchedSlug, code: validation.code }
      );
    }

    // Keep profile preference aligned with the portfolio that actually received capital.
    if (preferredSlug !== matchedSlug) {
      await this.supabase
        .from("profiles")
        .update({ preferred_package_slug: matchedSlug })
        .eq("id", userId);
    }

    // Consume entire available wallet balance — no partial invest, no leftover cash.
    let created: Investment;
    try {
      created = await this.purchasePlan(userId, plan.id, balance, undefined, context?.depositId);
    } catch (err) {
      // Exactly-once: unique source_deposit_id → return existing investment for this deposit.
      if (err instanceof AppError && err.code === "DUPLICATE_DEPOSIT_INVESTMENT" && context?.depositId) {
        const { data: existing } = await this.supabase
          .from("investments")
          .select("*")
          .eq("source_deposit_id", context.depositId)
          .neq("status", "cancelled")
          .maybeSingle();
        if (existing) return existing;
      }
      logger.error("Auto-invest purchase failed; no partial investment retained", {
        userId,
        depositId: context?.depositId,
        source: context?.source,
        matchedSlug,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }

    const walletAfter = await this.wallet.getBalance(wallet.id);
    const investedAmount = Number(created.amount);

    try {
      assertDepositInvestReconciliation({
        walletBefore,
        depositAmount: creditedAmount,
        investedAmount,
        walletAfter
      });
    } catch (reconcileError) {
      logger.error("Deposit/auto-invest ledger reconciliation failed — rolling back investment", {
        userId,
        depositId: context?.depositId,
        source: context?.source,
        investmentId: created.id,
        walletBefore,
        creditedAmount,
        investedAmount,
        walletAfter,
        error: reconcileError instanceof Error ? reconcileError.message : String(reconcileError)
      });
      await this.rollbackInvestmentPurchase(created);
      throw reconcileError;
    }

    if (isLegacyCapHealing(walletBefore, creditedAmount, investedAmount)) {
      await this.notifications.dispatch({
        userId,
        title: "Previous leftover funds invested",
        body: LEGACY_CAP_HEALING_MESSAGE,
        channel: "in_app",
        metadata: {
          deposit_id: context?.depositId ?? null,
          investment_id: created.id,
          healing: true,
          one_time: true,
          source: context?.source ?? null
        }
      });
    }

    logger.info("Auto-invested wallet balance into matched portfolio", {
      userId,
      investmentId: created.id,
      amount: investedAmount,
      matchedSlug,
      preferredSlug: preferredSlug || null,
      depositId: context?.depositId ?? null,
      source: context?.source ?? null
    });

    return created;
  }

  /** Reverse wallet debit and cancel investment so no partial position remains. */
  async rollbackInvestmentPurchase(investment: Investment) {
    const txId = investment.wallet_transaction_id;
    if (txId) {
      try {
        await this.wallet.reverseTransaction(txId);
      } catch (reverseErr) {
        logger.error("Failed to reverse investment debit during rollback", {
          investmentId: investment.id,
          transactionId: txId,
          error: reverseErr instanceof Error ? reverseErr.message : String(reverseErr)
        });
      }
    }

    await this.supabase.from("investment_settlements").delete().eq("investment_id", investment.id);

    await this.supabase
      .from("investments")
      .update({ status: "cancelled" } as Database["public"]["Tables"]["investments"]["Update"])
      .eq("id", investment.id);
  }

  async purchasePlan(
    userId: string,
    planId: string,
    amount: number,
    referenceOverride?: string,
    sourceDepositId?: string
  ): Promise<Investment> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw Errors.notFound("Investment portfolio");

    this.validatePurchaseAmount(plan, amount);

    if (sourceDepositId) {
      const { data: existingForDeposit } = await this.supabase
        .from("investments")
        .select("*")
        .eq("source_deposit_id", sourceDepositId)
        .neq("status", "cancelled")
        .maybeSingle();
      if (existingForDeposit) return existingForDeposit;
    }

    const reference = referenceOverride?.trim() || makeInvestmentReference(userId);
    const wallet = await this.wallet.getWalletByUserId(userId);
    const balance = await this.wallet.getBalance(wallet.id);

    if (balance < amount) {
      throw new AppError("Insufficient wallet balance.", 400, "INSUFFICIENT_BALANCE");
    }

    const startedAt = new Date();
    const endsAt = addDays(startedAt, plan.cycle_days);
    const frequency = (plan.settlement_frequency ?? "weekly") as SettlementFrequency;
    const tier = (plan.tier ?? "starter") as PortfolioSlug;
    const weeklyRoiBps = isPortfolioSlug(tier)
      ? getPortfolioWeeklyRoiBps(tier)
      : resolveWeeklyRoiBps({
          slug: tier,
          weeklyRoiBps: plan.weekly_roi_bps,
          amountNgn: amount
        });
    const projectedDaily = isPortfolioSlug(tier)
      ? platformProjectedDaily(amount, tier)
      : platformProjectedDaily(amount);

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
        weekly_roi_bps: weeklyRoiBps,
        source_deposit_id: sourceDepositId ?? null
      } as Database["public"]["Tables"]["investments"]["Insert"])
      .select()
      .single();

    if (invError) {
      if (invError.code === "23505") {
        if (sourceDepositId) {
          const { data: existingForDeposit } = await this.supabase
            .from("investments")
            .select("*")
            .eq("source_deposit_id", sourceDepositId)
            .neq("status", "cancelled")
            .maybeSingle();
          if (existingForDeposit) return existingForDeposit;
          throw new AppError("Duplicate investment for this deposit.", 409, "DUPLICATE_DEPOSIT_INVESTMENT");
        }
        throw new AppError("Duplicate purchase detected.", 409, "DUPLICATE");
      }
      throw invError;
    }

    let walletTxId: string | null = null;
    try {
      const tx = await this.wallet.debitInvestmentPurchase(wallet.id, amount, investment.id, reference);
      walletTxId = tx.id;

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
      if (walletTxId) {
        await this.wallet.reverseTransaction(walletTxId).catch(() => null);
      }
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
        "Cannot delete a portfolio that has investments. Archive it instead.",
        409,
        "PLAN_IN_USE"
      );
    }

    const { error } = await this.supabase.from("investment_plans").delete().eq("id", planId);
    if (error) throw error;
  }
}
