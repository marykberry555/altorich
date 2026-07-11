import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";

type Client = SupabaseClient<Database>;

export type NotificationPreferences = {
  in_app: boolean;
  email: boolean;
  sms: boolean;
};

export class ProfileService {
  constructor(private readonly supabase: Client) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  }

  async updateProfile(
    userId: string,
    input: { fullName?: string; phone?: string; avatarUrl?: string; preferredPackageSlug?: string }
  ) {
    const updates: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;
    if (input.preferredPackageSlug !== undefined) {
      updates.preferred_package_slug = input.preferredPackageSlug;
    }

    const { data, error } = await this.supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>) {
    const profile = await this.getProfile(userId);
    const current = (profile.notification_preferences ?? {}) as NotificationPreferences;
    const merged = { ...current, ...prefs };

    const { data, error } = await this.supabase
      .from("profiles")
      .update({ notification_preferences: merged as Json })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listBankAccounts(userId: string) {
    const { data, error } = await this.supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async addBankAccount(
    userId: string,
    input: { bankName: string; accountName: string; accountNumber: string; isDefault?: boolean }
  ) {
    if (input.isDefault) {
      await this.supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", userId);
    }

    const { data, error } = await this.supabase
      .from("bank_accounts")
      .insert({
        user_id: userId,
        bank_name: input.bankName,
        account_name: input.accountName,
        account_number: input.accountNumber,
        is_default: input.isDefault ?? false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBankAccount(userId: string, accountId: string) {
    const { data, error } = await this.supabase
      .from("bank_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", userId)
      .select("id");

    if (error) throw error;
    if (!data?.length) {
      throw new AppError("Bank account not found.", 404, "NOT_FOUND");
    }
  }

  async listMembers(page = 1, limit = 20, search?: string) {
    let query = this.supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,invite_code.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { members: data ?? [], total: count ?? 0, page, limit };
  }
}
