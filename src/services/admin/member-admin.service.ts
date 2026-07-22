import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { hashPin, isValidPin } from "@/lib/auth/pin";
import { WalletService } from "@/services/wallet/wallet.service";
import { assertIdentityAvailable } from "@/lib/validation/check-identity";
import { assertValidPhone, DUPLICATE_IDENTITY_MESSAGE, normalizePhone } from "@/lib/validation/identity";

type Client = SupabaseClient<Database>;
export type MemberAccountStatus = Database["public"]["Enums"]["member_account_status"];

export type AdminMemberRow = {
  id: string;
  username: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_package_slug: string | null;
  location_state_code: string | null;
  location_city_area: string | null;
  account_status: MemberAccountStatus;
  vip_level: number;
  invite_code: string;
  referred_by: string | null;
  email_verified_at: string | null;
  must_change_pin: boolean;
  must_change_password: boolean;
  notification_preferences: Database["public"]["Tables"]["profiles"]["Row"]["notification_preferences"];
  auto_weekly_payout: boolean;
  kyc_status?: Database["public"]["Enums"]["kyc_status"];
  created_at: string;
  updated_at: string;
  email: string | null;
  walletBalance: number;
};

export class MemberAdminService {
  private readonly wallet: WalletService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
  }

  private internalPassword() {
    return randomBytes(32).toString("hex");
  }

  async listMembers(
    page = 1,
    limit = 50,
    filters?: {
      search?: string;
      status?: string;
      kycStatus?: string;
      emailVerified?: "yes" | "no";
      memberId?: string;
      inviteCode?: string;
      registeredFrom?: string;
      registeredTo?: string;
      locationState?: string;
    }
  ) {
    let query = this.supabase
      .from("profiles")
      .select(
        "id, username, full_name, phone, avatar_url, preferred_package_slug, location_state_code, location_city_area, account_status, vip_level, invite_code, referred_by, email_verified_at, must_change_pin, must_change_password, notification_preferences, auto_weekly_payout, kyc_status, created_at, updated_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const search = filters?.search?.trim();
    if (filters?.memberId?.trim()) {
      query = query.eq("id", filters.memberId.trim());
    } else if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,invite_code.ilike.%${search}%,username.ilike.%${search}%,id.ilike.%${search}%`
      );
    }

    if (filters?.inviteCode?.trim()) {
      query = query.ilike("invite_code", `%${filters.inviteCode.trim()}%`);
    }
    if (filters?.status?.trim()) {
      query = query.eq("account_status", filters.status.trim() as MemberAccountStatus);
    }
    if (filters?.kycStatus?.trim()) {
      query = query.eq("kyc_status", filters.kycStatus.trim() as Database["public"]["Enums"]["kyc_status"]);
    }
    if (filters?.emailVerified === "yes") {
      query = query.not("email_verified_at", "is", null);
    } else if (filters?.emailVerified === "no") {
      query = query.is("email_verified_at", null);
    }
    if (filters?.registeredFrom) {
      query = query.gte("created_at", new Date(filters.registeredFrom).toISOString());
    }
    if (filters?.registeredTo) {
      const end = new Date(filters.registeredTo);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
    if (filters?.locationState?.trim()) {
      query = query.ilike("location_state_code", `%${filters.locationState.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const members = await Promise.all(
      (data ?? []).map(async (profile) => {
        const [authResult, walletResult] = await Promise.all([
          this.supabase.auth.admin.getUserById(profile.id),
          this.supabase.from("wallets").select("id").eq("user_id", profile.id).eq("currency", "NGN").maybeSingle()
        ]);

        let walletBalance = 0;
        if (walletResult.data?.id) {
          walletBalance = await this.wallet.getBalance(walletResult.data.id);
        }

        return {
          ...profile,
          email: authResult.data.user?.email ?? null,
          walletBalance
        } satisfies AdminMemberRow;
      })
    );

    return { members, total: count ?? 0, page, limit };
  }

  async createMember(input: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    pin: string;
  }) {
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      throw new AppError("Username must be 3–24 characters (letters, numbers, underscore).", 400, "INVALID_USERNAME");
    }
    if (!isValidPin(input.pin)) throw new AppError("Pin must be exactly 6 digits.", 400, "INVALID_PIN");

    const email = input.email.trim().toLowerCase();
    const phone = normalizePhone(input.phone);
    assertValidPhone(phone);

    await assertIdentityAvailable(this.supabase, { username, email, phone });

    const pinHash = hashPin(input.pin);
    const password = this.internalPassword();

    const { data: created, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        phone,
        username,
        pin_hash: pinHash
      }
    });
    if (error) {
      if (/already been registered|already exists|duplicate/i.test(error.message)) {
        throw new AppError(DUPLICATE_IDENTITY_MESSAGE, 409, "IDENTITY_TAKEN", DUPLICATE_IDENTITY_MESSAGE);
      }
      throw error;
    }
    if (!created.user) throw Errors.internal();

    await this.supabase
      .from("profiles")
      .update({
        username,
        pin_hash: pinHash,
        phone,
        full_name: input.fullName.trim(),
        account_status: "active",
        email_verified_at: new Date().toISOString()
      })
      .eq("id", created.user.id);

    return { userId: created.user.id, email, username };
  }

  async setAccountStatus(userId: string, status: MemberAccountStatus) {
    const { PROFILE_SAFE_COLUMNS, toPublicProfile } = await import("@/lib/security/profile-safe");
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", userId)
      .select(PROFILE_SAFE_COLUMNS)
      .single();
    if (error) throw error;
    return toPublicProfile(data as Record<string, unknown>) as typeof data;
  }

  private async assertDeletable(userId: string) {
    const { data: adminRole } = await this.supabase.from("admin_roles").select("id").eq("user_id", userId).maybeSingle();
    if (adminRole) {
      throw new AppError("Cannot delete admin accounts.", 403, "ADMIN_PROTECTED");
    }
  }

  private formatDeleteError(error: unknown): string {
    if (error instanceof AppError) return error.message;
    if (error && typeof error === "object") {
      const e = error as { message?: string; details?: string; hint?: string; code?: string; name?: string; status?: number };
      const parts = [e.message, e.details, e.hint].filter(
        (part): part is string => typeof part === "string" && part.trim().length > 0 && part.trim() !== "{}"
      );
      if (parts.length > 0) return parts.join(" — ");
      if (typeof e.code === "string" && e.code) return `Delete failed (${e.code})`;
      if (typeof e.name === "string" && e.name && e.name !== "Error") {
        return `Delete failed (${e.name}${e.status ? ` ${e.status}` : ""})`;
      }
    }
    if (error instanceof Error && error.message && error.message !== "{}") return error.message;
    return "Delete failed";
  }

  private async deleteByUser(table: string, column: string, userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- purge covers tables not all typed in Database
    const { error } = await (this.supabase as any).from(table).delete().eq(column, userId);
    if (error) throw error;
  }

  /** Remove dependent rows so auth user (and profile) can be deleted. */
  private async purgeMemberData(userId: string) {
    await this.assertDeletable(userId);

    // Detach welcome-bonus slots + audit actor refs before dependent deletes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: prepareError } = await (this.supabase as any).rpc("admin_prepare_member_hard_delete", {
      p_user_id: userId
    });
    if (prepareError) throw prepareError;

    await this.deleteByUser("roi_payouts", "user_id", userId);
    await this.deleteByUser("roi_investments", "user_id", userId);
    await this.deleteByUser("investments", "user_id", userId);
    await this.deleteByUser("capital_liquidation_requests", "user_id", userId);
    await this.deleteByUser("withdrawals", "user_id", userId);
    await this.deleteByUser("payment_transactions", "user_id", userId);
    await this.deleteByUser("deposits", "user_id", userId);
    await this.deleteByUser("bank_accounts", "user_id", userId);
    await this.deleteByUser("member_crypto_wallets", "user_id", userId);
    await this.deleteByUser("kyc_documents", "user_id", userId);
    await this.deleteByUser("notifications", "user_id", userId);
    await this.deleteByUser("activity_logs", "user_id", userId);
    await this.deleteByUser("login_activity", "user_id", userId);
    await this.deleteByUser("trusted_devices", "user_id", userId);
    await this.deleteByUser("auth_otps", "user_id", userId);
    await this.deleteByUser("security_events", "user_id", userId);
    await this.deleteByUser("admin_notes", "member_id", userId);
    await this.deleteByUser("referral_rewards", "referrer_id", userId);
    await this.deleteByUser("referral_payouts", "user_id", userId);

    const { data: wallets, error: walletListError } = await this.supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId);
    if (walletListError) throw walletListError;

    for (const wallet of wallets ?? []) {
      const { error } = await this.supabase.from("wallet_transactions").delete().eq("wallet_id", wallet.id);
      if (error) throw error;
    }

    await this.deleteByUser("wallets", "user_id", userId);

    const { error: referralsError } = await this.supabase
      .from("referrals")
      .delete()
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    if (referralsError) throw referralsError;

    const { error: clearReferrerError } = await this.supabase
      .from("profiles")
      .update({ referred_by: null })
      .eq("referred_by", userId);
    if (clearReferrerError) throw clearReferrerError;

    const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
  }

  async deleteMembers(userIds: string[]) {
    const results: { id: string; ok: boolean; error?: string }[] = [];
    for (const id of userIds) {
      try {
        await this.purgeMemberData(id);
        results.push({ id, ok: true });
      } catch (error) {
        results.push({ id, ok: false, error: this.formatDeleteError(error) });
      }
    }
    return results;
  }

  async getMemberDetail(userId: string) {
    const { PROFILE_SAFE_COLUMNS, toPublicProfile } = await import("@/lib/security/profile-safe");
    const { data: profile, error: profileError } = await this.supabase
      .from("profiles")
      .select(PROFILE_SAFE_COLUMNS)
      .eq("id", userId)
      .single();
    if (profileError || !profile) throw Errors.notFound("Member");

    const authResult = await this.supabase.auth.admin.getUserById(userId);
    const email = authResult.data.user?.email ?? null;

    const walletRow = await this.supabase.from("wallets").select("id").eq("user_id", userId).eq("currency", "NGN").maybeSingle();
    let walletBalance = 0;
    let walletTransactions: Database["public"]["Tables"]["wallet_transactions"]["Row"][] = [];

    if (walletRow.data?.id) {
      walletBalance = await this.wallet.getBalance(walletRow.data.id);
      const { data: txns } = await this.supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", walletRow.data.id)
        .order("created_at", { ascending: false })
        .limit(40);
      walletTransactions = txns ?? [];
    }

    const [investments, withdrawals, deposits, referralsAsReferrer, bankAccounts] = await Promise.all([
      this.supabase
        .from("investments")
        .select("*, investment_plans(name, slug, settlement_frequency)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      this.supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
      this.supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
      this.supabase.from("referrals").select("*").eq("referrer_id", userId),
      this.supabase.from("bank_accounts").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    ]);

    if (investments.error) throw investments.error;
    if (withdrawals.error) throw withdrawals.error;
    if (deposits.error) throw deposits.error;
    if (referralsAsReferrer.error) throw referralsAsReferrer.error;
    if (bankAccounts.error) throw bankAccounts.error;

    return {
      profile: toPublicProfile(profile as Record<string, unknown>),
      email,
      walletBalance,
      walletTransactions,
      investments: investments.data ?? [],
      withdrawals: withdrawals.data ?? [],
      deposits: deposits.data ?? [],
      referrals: referralsAsReferrer.data ?? [],
      bankAccounts: bankAccounts.data ?? []
    };
  }

  async adjustWallet(userId: string, amount: number, note?: string) {
    const wallet = await this.wallet.getWalletByUserId(userId);
    const reference = `ADM-${Date.now()}-${randomBytes(4).toString("hex")}`;

    if (amount > 0) {
      await this.wallet.postTransaction({
        walletId: wallet.id,
        type: "credit",
        amount,
        reference,
        reason: "adjustment",
        metadata: { admin_note: note ?? "Admin credit", source: "admin" }
      });
    } else if (amount < 0) {
      const debitAmount = Math.abs(amount);
      const balance = await this.wallet.getBalance(wallet.id);
      if (balance < debitAmount) {
        throw new AppError("Insufficient wallet balance for debit.", 400, "INSUFFICIENT_BALANCE");
      }
      await this.wallet.postTransaction({
        walletId: wallet.id,
        type: "debit",
        amount: debitAmount,
        reference,
        reason: "adjustment",
        metadata: { admin_note: note ?? "Admin debit", source: "admin" }
      });
    }

    const balance = await this.wallet.getBalance(wallet.id);
    return { walletId: wallet.id, balance };
  }
}
