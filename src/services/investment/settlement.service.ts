import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { WithdrawalService } from "@/services/withdrawal/withdrawal.service";
import { settlementDates, type SettlementFrequency } from "@/lib/investment";
import { settlementInterestForInvestment, weeklySettlementWindow } from "@/lib/investment/accrual-math";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

type Client = SupabaseClient<Database>;

export class SettlementService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
  }

  async createScheduleForInvestment(
    investmentId: string,
    plan: {
      projected_daily: number;
      cycle_days: number;
      settlement_frequency: SettlementFrequency;
    },
    amount: number,
    startedAt: Date,
    endsAt: Date,
    weeklyRoiBps?: number
  ) {
    const frequency = plan.settlement_frequency ?? "weekly";
    const schedule = settlementDates(
      startedAt,
      endsAt,
      frequency,
      Number(plan.projected_daily),
      amount,
      weeklyRoiBps
    );

    if (schedule.length === 0) return [];

    const rows = schedule.map((item) => ({
      investment_id: investmentId,
      amount: item.amount,
      scheduled_for: item.date.toISOString().slice(0, 10),
      status: "scheduled" as const
    }));

    const { data, error } = await this.supabase.from("investment_settlements").insert(rows).select();
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Weekly Monday settlement: auto-reinvest earnings or pay to wallet when stop requested.
   */
  async processWeeklyMondaySettlements(asOf = new Date()) {
    const { data: active, error } = await this.supabase
      .from("investments")
      .select("*, investment_plans(weekly_roi_bps, tier)")
      .in("status", ["active", "stopping"]);

    if (error) throw error;

    const results: { investmentId: string; amount: number; action: "reinvest" | "payout" }[] = [];

    for (const investment of active ?? []) {
      const bps = PLATFORM_EARNING.weeklyRoiBps;
      const amount = Number(investment.amount);
      const lastWeeklySettlementAt = (investment as { last_weekly_settlement_at?: string | null })
        .last_weekly_settlement_at
        ? new Date((investment as { last_weekly_settlement_at?: string | null }).last_weekly_settlement_at!)
        : null;
      const startedAt = new Date(investment.started_at);
      const endsAt = new Date(investment.ends_at);
      const window = weeklySettlementWindow({
        startedAt,
        lastWeeklySettlementAt,
        endsAt
      });
      if (!window) continue;

      const interest = settlementInterestForInvestment({
        principal: amount,
        weeklyRoiBps: bps,
        startedAt,
        lastWeeklySettlementAt,
        endsAt,
        asOf
      });
      if (interest <= 0) continue;

      // Claim the completed Monday period (not wall-clock asOf) so the next week starts correctly.
      const claimTs = window.periodEnd.toISOString();
      const periodKey = claimTs.slice(0, 10);

      const { data: claimed, error: claimError } = await this.supabase
        .from("investments")
        .update({
          last_weekly_settlement_at: claimTs
        } as Database["public"]["Tables"]["investments"]["Update"])
        .eq("id", investment.id)
        .in("status", ["active", "stopping"])
        .or(`last_weekly_settlement_at.is.null,last_weekly_settlement_at.lt."${claimTs}"`)
        .select("id")
        .maybeSingle();

      if (claimError) throw claimError;
      if (!claimed) continue;

      const stopRequested = Boolean((investment as { stop_requested_at?: string | null }).stop_requested_at);
      const userId = investment.user_id;
      const settlementRef = `${investment.id}-${periodKey}`;

      try {
        const { data: profile } = await this.supabase
          .from("profiles")
          .select("auto_weekly_payout")
          .eq("id", userId)
          .maybeSingle();

        const autoWeeklyPayout = Boolean(profile?.auto_weekly_payout);

        if (autoWeeklyPayout && !stopRequested) {
          const wallet = await this.wallet.getWalletByUserId(userId);
          await this.wallet.creditInvestmentSettlement(wallet.id, interest, investment.id, `auto-payout-${settlementRef}`);

          await this.supabase
            .from("investments")
            .update({
              total_earned: Number(investment.total_earned ?? 0) + interest
            } as Database["public"]["Tables"]["investments"]["Update"])
            .eq("id", investment.id);

          await this.notifications.notifyEvent("settlement.completed", userId, {
            amount: interest,
            investment_id: investment.id,
            action: "auto_payout"
          });

          const { data: bankAccounts } = await this.supabase
            .from("bank_accounts")
            .select("*")
            .eq("user_id", userId)
            .order("is_default", { ascending: false })
            .limit(1);

          const bank = bankAccounts?.[0];
          if (bank) {
            const withdrawals = new WithdrawalService(this.supabase);
            await withdrawals.createAutomaticFromSettlement({
              userId,
              amount: interest,
              bankName: bank.bank_name,
              accountName: bank.account_name,
              accountNumber: bank.account_number,
              bankAccountId: bank.id,
              asOf
            });
          } else {
            await this.notifications.notifyEvent("withdrawal.auto_skipped", userId, {
              amount: interest,
              reason: "Add a payout bank account to receive automatic withdrawals."
            });
          }

          results.push({ investmentId: investment.id, amount: interest, action: "payout" });
        } else if (stopRequested) {
          const wallet = await this.wallet.getWalletByUserId(userId);
          await this.wallet.creditInvestmentSettlement(wallet.id, interest, investment.id, `stop-${settlementRef}`);

          await this.supabase
            .from("investments")
            .update({
              status: "stopped",
              total_earned: Number(investment.total_earned ?? 0) + interest,
              stop_requested_at: null,
              auto_reinvest: false
            } as Database["public"]["Tables"]["investments"]["Update"])
            .eq("id", investment.id);

          await this.notifications.notifyEvent("settlement.completed", userId, {
            amount: interest,
            investment_id: investment.id,
            action: "payout"
          });

          results.push({ investmentId: investment.id, amount: interest, action: "payout" });
        } else {
          const newPrincipal = amount + interest;
          await this.supabase
            .from("investments")
            .update({
              amount: newPrincipal,
              total_earned: Number(investment.total_earned ?? 0) + interest
            } as Database["public"]["Tables"]["investments"]["Update"])
            .eq("id", investment.id);

          await this.notifications.notifyEvent("settlement.completed", userId, {
            amount: interest,
            investment_id: investment.id,
            action: "reinvest"
          });

          results.push({ investmentId: investment.id, amount: interest, action: "reinvest" });
        }
      } catch (err) {
        // Roll claim so a failed credit can be retried on the next run.
        await this.supabase
          .from("investments")
          .update({
            last_weekly_settlement_at: (investment as { last_weekly_settlement_at?: string | null })
              .last_weekly_settlement_at ?? null
          } as Database["public"]["Tables"]["investments"]["Update"])
          .eq("id", investment.id);
        throw err;
      }
    }

    return results;
  }

  async processDueSettlements(asOf = new Date()) {
    const today = asOf.toISOString().slice(0, 10);

    const { data: due, error } = await this.supabase
      .from("investment_settlements")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", today);

    if (error) throw error;
    const results = [];

    for (const settlement of due ?? []) {
      const { data: investment, error: invError } = await this.supabase
        .from("investments")
        .select("*")
        .eq("id", settlement.investment_id)
        .single();

      if (invError || !investment || !["active", "stopping"].includes(investment.status)) continue;

      const stopRequested = Boolean((investment as { stop_requested_at?: string | null }).stop_requested_at);
      const autoReinvest = (investment as { auto_reinvest?: boolean }).auto_reinvest !== false;
      const interest = Number(settlement.amount);

      if (stopRequested || !autoReinvest) {
        const wallet = await this.wallet.getWalletByUserId(investment.user_id);
        const tx = await this.wallet.creditInvestmentSettlement(
          wallet.id,
          interest,
          investment.id,
          settlement.id
        );

        await this.supabase
          .from("investment_settlements")
          .update({
            status: "paid",
            wallet_transaction_id: tx.id,
            settled_at: new Date().toISOString()
          })
          .eq("id", settlement.id);

        if (stopRequested) {
          await this.supabase
            .from("investments")
            .update({
              status: "stopped",
              stop_requested_at: null,
              auto_reinvest: false
            } as Database["public"]["Tables"]["investments"]["Update"])
            .eq("id", investment.id);
        }
      } else {
        const newPrincipal = Number(investment.amount) + interest;
        await this.supabase
          .from("investments")
          .update({
            amount: newPrincipal,
            total_earned: Number(investment.total_earned ?? 0) + interest
          } as Database["public"]["Tables"]["investments"]["Update"])
          .eq("id", investment.id);

        await this.supabase
          .from("investment_settlements")
          .update({
            status: "paid",
            settled_at: new Date().toISOString()
          })
          .eq("id", settlement.id);
      }

      const newEarned = Number(investment.total_earned ?? 0) + interest;
      await this.supabase
        .from("investments")
        .update({ total_earned: newEarned } as Database["public"]["Tables"]["investments"]["Update"])
        .eq("id", investment.id);

      await this.notifications.notifyEvent("settlement.completed", investment.user_id, {
        amount: interest,
        investment_id: investment.id,
        settlement_id: settlement.id
      });

      results.push({ settlementId: settlement.id, amount: interest });
    }

    return results;
  }

  async matureInvestments(asOf = new Date()) {
    const { data: matured, error } = await this.supabase
      .from("investments")
      .select("*")
      .eq("status", "active")
      .lte("ends_at", asOf.toISOString());

    if (error) throw error;
    const results = [];

    for (const inv of matured ?? []) {
      const { data: pending } = await this.supabase
        .from("investment_settlements")
        .select("id")
        .eq("investment_id", inv.id)
        .eq("status", "scheduled");

      if ((pending?.length ?? 0) > 0) continue;

      await this.supabase
        .from("investments")
        .update({
          status: "matured",
          matured_at: new Date().toISOString()
        } as Database["public"]["Tables"]["investments"]["Update"])
        .eq("id", inv.id);

      await this.notifications.dispatch({
        userId: inv.user_id,
        title: "Investment matured",
        body: `Your investment ${inv.reference ?? inv.id.slice(0, 8)} has reached maturity.`,
        channel: "in_app",
        metadata: { investment_id: inv.id }
      });

      results.push(inv.id);
    }

    return results;
  }

  async listForInvestment(investmentId: string) {
    const { data, error } = await this.supabase
      .from("investment_settlements")
      .select("*")
      .eq("investment_id", investmentId)
      .order("scheduled_for", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}
