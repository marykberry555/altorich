import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export class SettingsService {
  constructor(private readonly supabase: Client) {}

  async get<T = Record<string, unknown>>(key: string): Promise<T | null> {
    const { data, error } = await this.supabase.from("settings").select("value").eq("key", key).single();
    if (error) return null;
    return data.value as T;
  }

  async getBankSwitchboard() {
    return (
      (await this.get<{
        active_bank_name: string;
        active_account_name: string;
        active_account_number: string;
        payment_instruction: string;
        transfer_narration: string;
        contributions_enabled: boolean;
      }>("bank_switchboard")) ?? {
        active_bank_name: "Configure in admin",
        active_account_name: "ALTORICH LTD",
        active_account_number: "00000000",
        payment_instruction: "Send the exact amount, then submit your transfer reference.",
        transfer_narration: "Use your registered phone number as narration.",
        contributions_enabled: true
      }
    );
  }

  async getAnnouncement() {
    const data = await this.get<{ global: string }>("announcements");
    return data?.global ?? "AltoRich is onboarding verified members.";
  }

  async getWithdrawalWindows() {
    const data = await this.get<{ description: string }>("withdrawal_windows");
    return data?.description ?? "Mondays and Thursdays from 8:00 AM WAT";
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
}
