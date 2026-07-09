import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { settlementDates, type SettlementFrequency } from "@/lib/investment";

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
    endsAt: Date
  ) {
    const frequency = plan.settlement_frequency ?? "daily";
    const schedule = settlementDates(startedAt, endsAt, frequency, Number(plan.projected_daily), amount);

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

      if (invError || !investment || investment.status !== "active") continue;

      const wallet = await this.wallet.getWalletByUserId(investment.user_id);
      const tx = await this.wallet.creditInvestmentSettlement(
        wallet.id,
        Number(settlement.amount),
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

      const newEarned = Number(investment.total_earned ?? 0) + Number(settlement.amount);
      await this.supabase
        .from("investments")
        .update({ total_earned: newEarned } as Database["public"]["Tables"]["investments"]["Update"])
        .eq("id", investment.id);

      await this.notifications.notifyEvent("settlement.completed", investment.user_id, {
        amount: Number(settlement.amount),
        investment_id: investment.id,
        settlement_id: settlement.id
      });

      results.push({ settlementId: settlement.id, amount: settlement.amount });
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
