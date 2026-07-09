import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { Errors, AppError } from "@/lib/errors";
import { currentTickerWindowLagos } from "@/lib/roi/time";
import { computeWeeklyTicker } from "@/lib/roi/math";
import { SettingsService } from "@/services/admin/settings.service";

type Client = SupabaseClient<Database>;

export type RoiTier = Database["public"]["Tables"]["roi_tiers"]["Row"];
export type RoiInvestment = Database["public"]["Tables"]["roi_investments"]["Row"];

export type RoiState = {
  activeInvestment: (RoiInvestment & { tier: RoiTier }) | null;
  exchangeRateNgnPerUsd: number;
};

export class RoiService {
  private readonly settings: SettingsService;

  constructor(private readonly supabase: Client) {
    this.settings = new SettingsService(supabase);
  }

  async listTiers(): Promise<RoiTier[]> {
    const { data, error } = await this.supabase
      .from("roi_tiers")
      .select("*")
      .order("min_ngn", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getExchangeRateNgnPerUsd(): Promise<number> {
    const rate = await this.settings.get<{ ngn_per_usd?: number }>("roi_exchange_rate");
    const value = Number(rate?.ngn_per_usd ?? 0);
    return value > 0 ? value : 1600; // default fallback
  }

  async getActiveInvestment(userId: string): Promise<(RoiInvestment & { tier: RoiTier }) | null> {
    const { data, error } = await this.supabase
      .from("roi_investments")
      .select("*, tier:roi_tiers(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as (RoiInvestment & { tier: RoiTier })) ?? null;
  }

  async getState(userId: string): Promise<RoiState> {
    const [activeInvestment, exchangeRateNgnPerUsd] = await Promise.all([
      this.getActiveInvestment(userId),
      this.getExchangeRateNgnPerUsd()
    ]);
    return { activeInvestment, exchangeRateNgnPerUsd };
  }

  validateTierAmount(tier: RoiTier, principalNgn: number) {
    const min = Number(tier.min_ngn);
    const max = Number(tier.max_ngn);
    if (principalNgn < min) throw new AppError(`Minimum for ${tier.name} is ₦${min.toLocaleString("en-NG")}.`, 400, "BELOW_MIN");
    if (principalNgn > max) throw new AppError(`Maximum for ${tier.name} is ₦${max.toLocaleString("en-NG")}.`, 400, "ABOVE_MAX");
  }

  async createInvestment(input: {
    userId: string;
    tierId: string;
    principalNgn: number;
    currency: Database["public"]["Enums"]["investment_currency"];
    payoutMethod: Database["public"]["Enums"]["payout_method"];
    payoutDestination: Record<string, unknown>;
  }) {
    const tiers = await this.listTiers();
    const tier = tiers.find((t) => t.id === input.tierId);
    if (!tier) throw Errors.notFound("ROI tier");

    const principalNgn = Number(input.principalNgn);
    if (!Number.isFinite(principalNgn) || principalNgn <= 0) throw Errors.badRequest("Invalid amount.");
    this.validateTierAmount(tier, principalNgn);

    const exchange = await this.getExchangeRateNgnPerUsd();
    const principalUsd = input.currency === "ngn" ? null : Number((principalNgn / exchange).toFixed(2));

    const { start, end } = currentTickerWindowLagos(new Date());

    const { data, error } = await this.supabase
      .from("roi_investments")
      .insert({
        user_id: input.userId,
        tier_id: input.tierId,
        principal_ngn: principalNgn,
        currency: input.currency,
        principal_usd: principalUsd,
        exchange_rate_ngn_per_usd: exchange,
        payout_method: input.payoutMethod,
        payout_destination: input.payoutDestination as Json,
        status: "active",
        cycle_started_at: start.toISOString(),
        cycle_ends_at: end.toISOString(),
        accrued_ngn: 0
      } as Database["public"]["Tables"]["roi_investments"]["Insert"])
      .select("*, tier:roi_tiers(*)")
      .single();

    if (error) throw error;
    return data as unknown as RoiInvestment & { tier: RoiTier };
  }

  /**
   * Restart the weekly interest cycle from zero (e.g. after deposit approval funds an investment).
   */
  async resetWeeklyCycle(userId: string) {
    const active = await this.getActiveInvestment(userId);
    if (!active) return null;

    const { start, end } = currentTickerWindowLagos(new Date());
    const { data, error } = await this.supabase
      .from("roi_investments")
      .update({
        cycle_started_at: start.toISOString(),
        cycle_ends_at: end.toISOString(),
        accrued_ngn: 0,
        last_ticker_at: new Date().toISOString()
      })
      .eq("id", active.id)
      .select("*, tier:roi_tiers(*)")
      .single();

    if (error) throw error;
    return data as unknown as RoiInvestment & { tier: RoiTier };
  }

  /**
   * Deterministic ticker computation (no DB writes):\n
   * accrued = weeklyInterest * progress\n
   * where weeklyInterest = principal * weekly_roi\n
   */
  computeTicker(input: {
    principalNgn: number;
    weeklyRoiBps: number;
    cycleStartedAt: string;
    cycleEndsAt: string;
    now?: Date;
  }) {
    return computeWeeklyTicker(input);
  }
}

