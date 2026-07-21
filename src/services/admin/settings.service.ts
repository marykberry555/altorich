import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { mergeFeatureFlags, type FeatureFlags } from "@/lib/feature-flags";
import {
  HOMEPAGE_STATS_SETTINGS_KEY,
  mergeHomepageStats,
  type HomepageStatsConfig
} from "@/lib/homepage/homepage-stats";
import {
  mergeSettlementQueueConfig,
  SETTLEMENT_QUEUE_SETTINGS_KEY,
  type SettlementQueueConfig
} from "@/lib/payout/settlement-queue";
import { PAYMENT_RAILS_SETTINGS_KEY, type PaymentRailsLiveState } from "@/config/payment-rails";

type Client = SupabaseClient<Database>;

export class SettingsService {
  constructor(private readonly supabase: Client) {}

  async get<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const { data, error } = await this.supabase.from("settings").select("value").eq("key", key).single();
    if (error) return null;
    return data.value as T;
  }

  async getBankSwitchboard() {
    try {
      const preferred = await this.supabase
        .from("funding_accounts")
        .select("*")
        .eq("status", "active")
        .order("is_preferred", { ascending: false })
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!preferred.error && preferred.data) {
        return {
          active_bank_name: preferred.data.bank_name,
          active_account_name: preferred.data.account_name,
          active_account_number: preferred.data.account_number,
          payment_instruction:
            preferred.data.funding_instructions ??
            "Send the exact amount, then submit your transfer reference for verification.",
          transfer_narration: "Use your registered phone number as transfer narration.",
          contributions_enabled: true
        };
      }
    } catch {
      // funding_accounts may not exist before migration is applied
    }

    return (
      (await this.get<{
        active_bank_name: string;
        active_account_name: string;
        active_account_number: string;
        payment_instruction: string;
        transfer_narration: string;
        contributions_enabled: boolean;
      }>("bank_switchboard")) ?? {
        active_bank_name: "Funding details pending",
        active_account_name: "ALTORICH LTD",
        active_account_number: "—",
        payment_instruction: "Funding details will appear here once configured.",
        transfer_narration: "Use your registered phone number as narration.",
        contributions_enabled: true
      }
    );
  }

  async getAuthSettings() {
    return (
      (await this.get<{ trusted_device_days?: number }>("auth_settings")) ?? {
        trusted_device_days: 90
      }
    );
  }

  async updateAuthSettings(updates: { trusted_device_days?: number }, updatedBy?: string) {
    const current = await this.getAuthSettings();
    const { error } = await this.supabase.from("settings").upsert({
      key: "auth_settings",
      value: { ...current, ...updates },
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async getAnnouncement() {
    const data = await this.get<{ global: string }>("announcements");
    return data?.global ?? "AltoRich is onboarding verified members.";
  }

  async getWithdrawalWindows() {
    const data = await this.get<{ description: string }>("withdrawal_windows");
    return data?.description ?? "Mondays and Thursdays from 8:00 AM WAT";
  }

  async getCryptoWallets() {
    return (
      (await this.get<{
        usdt: { network: string; address: string };
        usdc: { network: string; address: string };
        btc: { address: string };
        addresses?: Array<{
          asset: string;
          network: string;
          address: string;
          label?: string;
        }>;
      }>("crypto_wallets")) ?? {
        usdt: { network: "", address: "" },
        usdc: { network: "", address: "" },
        btc: { address: "" },
        addresses: []
      }
    );
  }

  async updateCryptoWallets(
    value: {
      usdt: { network: string; address: string };
      usdc: { network: string; address: string };
      btc: { address: string };
      addresses?: unknown[];
    },
    updatedBy?: string
  ) {
    const { error } = await this.supabase.from("settings").upsert({
      key: "crypto_wallets",
      value,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async getPaymentRailsLive() {
    return this.get<PaymentRailsLiveState>(PAYMENT_RAILS_SETTINGS_KEY);
  }

  async updatePaymentRailsLive(value: PaymentRailsLiveState, updatedBy?: string) {
    const { error } = await this.supabase.from("settings").upsert({
      key: PAYMENT_RAILS_SETTINGS_KEY,
      value,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async getFeatureFlags(): Promise<FeatureFlags> {
    const data = await this.get<Partial<FeatureFlags>>("feature_flags");
    return mergeFeatureFlags(data);
  }

  async updateFeatureFlags(updates: Partial<FeatureFlags>, updatedBy?: string) {
    const current = await this.getFeatureFlags();
    const { error } = await this.supabase.from("settings").upsert({
      key: "feature_flags",
      value: { ...current, ...updates },
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async updateBankSwitchboard(updates: Record<string, unknown>, updatedBy?: string) {
    const current = await this.getBankSwitchboard();
    const { error } = await this.supabase.from("settings").upsert({
      key: "bank_switchboard",
      value: { ...current, ...updates },
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async updateAnnouncement(message: string, updatedBy?: string) {
    const { error } = await this.supabase.from("settings").upsert({
      key: "announcements",
      value: { global: message },
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
  }

  async getHomepageStats() {
    const data = await this.get<Partial<HomepageStatsConfig>>(HOMEPAGE_STATS_SETTINGS_KEY);
    return mergeHomepageStats(data);
  }

  async updateHomepageStats(updates: Partial<HomepageStatsConfig>, updatedBy?: string) {
    const current = await this.getHomepageStats();
    const next = mergeHomepageStats({ ...current, ...updates });
    const { error } = await this.supabase.from("settings").upsert({
      key: HOMEPAGE_STATS_SETTINGS_KEY,
      value: next,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
    return next;
  }

  async getSettlementQueueConfig() {
    const data = await this.get<Partial<SettlementQueueConfig>>(SETTLEMENT_QUEUE_SETTINGS_KEY);
    return mergeSettlementQueueConfig(data);
  }

  async updateSettlementQueueConfig(updates: Partial<SettlementQueueConfig>, updatedBy?: string) {
    const current = await this.getSettlementQueueConfig();
    const next = mergeSettlementQueueConfig({ ...current, ...updates });
    const { error } = await this.supabase.from("settings").upsert({
      key: SETTLEMENT_QUEUE_SETTINGS_KEY,
      value: next,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString()
    } as Database["public"]["Tables"]["settings"]["Insert"]);
    if (error) throw error;
    return next;
  }
}
