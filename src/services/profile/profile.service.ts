import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { assertIdentityAvailable } from "@/lib/validation/check-identity";
import {
  assertValidAccountNumber,
  assertValidPhone,
  normalizeAccountNumber,
  normalizePhone
} from "@/lib/validation/identity";

type Client = SupabaseClient<Database>;

export type NotificationPreferences = {
  in_app: boolean;
  email: boolean;
  sms: boolean;
};

export class ProfileService {
  constructor(private readonly supabase: Client) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select(
        "id, username, full_name, phone, avatar_url, preferred_package_slug, location_state_code, location_city_area, account_status, vip_level, invite_code, referred_by, email_verified_at, must_change_pin, must_change_password, notification_preferences, auto_weekly_payout, created_at, updated_at"
      )
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  }

  /** Registered legal name — members cannot change this via self-service. */
  async getRegisteredFullName(userId: string): Promise<string> {
    const profile = await this.getProfile(userId);
    const name = profile.full_name?.trim() ?? "";
    if (!name) {
      throw Errors.badRequest(
        "Your registered full name is missing. Please contact Alto Rich Support before continuing."
      );
    }
    return name;
  }

  async updateProfile(
    userId: string,
    input: {
      phone?: string;
      avatarUrl?: string;
      preferredPackageSlug?: string;
      locationStateCode?: string;
      locationCityArea?: string;
    }
  ) {
    const updates: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (input.phone !== undefined) {
      const phone = normalizePhone(input.phone);
      assertValidPhone(phone);
      await assertIdentityAvailable(this.supabase, { phone, excludeUserId: userId });
      updates.phone = phone;
    }
    if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;
    if (input.preferredPackageSlug !== undefined) {
      updates.preferred_package_slug = input.preferredPackageSlug;
    }
    if (input.locationStateCode !== undefined) {
      updates.location_state_code = input.locationStateCode;
    }
    if (input.locationCityArea !== undefined) {
      updates.location_city_area = input.locationCityArea;
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
    input: { bankName: string; accountNumber: string; isDefault?: boolean; accountName?: string }
  ) {
    const accountNumber = normalizeAccountNumber(input.accountNumber);
    assertValidAccountNumber(accountNumber);
    const accountName = await this.getRegisteredFullName(userId);

    if (input.isDefault) {
      await this.supabase.from("bank_accounts").update({ is_default: false }).eq("user_id", userId);
    }

    const { data, error } = await this.supabase
      .from("bank_accounts")
      .insert({
        user_id: userId,
        bank_name: input.bankName,
        account_name: accountName,
        account_number: accountNumber,
        is_default: input.isDefault ?? false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async upsertPayoutBankAccount(
    userId: string,
    input: { bankName: string; accountNumber: string; accountName?: string }
  ) {
    const accountNumber = normalizeAccountNumber(input.accountNumber);
    assertValidAccountNumber(accountNumber);
    const accountName = await this.getRegisteredFullName(userId);

    const accounts = await this.listBankAccounts(userId);
    const primary = accounts.find((a) => a.is_default) ?? accounts[0];

    if (!primary) {
      return this.addBankAccount(userId, {
        bankName: input.bankName,
        accountNumber,
        isDefault: true
      });
    }

    const { data, error } = await this.supabase
      .from("bank_accounts")
      .update({
        bank_name: input.bankName,
        account_name: accountName,
        account_number: accountNumber,
        is_default: true
      })
      .eq("id", primary.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    if (accounts.length > 1) {
      await this.supabase.from("bank_accounts").delete().eq("user_id", userId).neq("id", primary.id);
    }

    return data;
  }

  async setAutoWeeklyPayout(userId: string, enabled: boolean) {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ auto_weekly_payout: enabled })
      .eq("id", userId)
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
