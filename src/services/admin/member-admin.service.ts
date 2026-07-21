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

export type AdminMemberRow = Database["public"]["Tables"]["profiles"]["Row"] & {
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
      .select("*", { count: "exact" })
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
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  private async assertDeletable(userId: string) {
    const { data: adminRole } = await this.supabase.from("admin_roles").select("id").eq("user_id", userId).maybeSingle();
    if (adminRole) {
      throw new AppError("Cannot delete admin accounts.", 403, "ADMIN_PROTECTED");
    }
  }

  /** Remove dependent rows so auth user (and profile) can be deleted. */
  private async purgeMemberData(userId: string) {
    await this.assertDeletable(userId);

    const deleteEq = async (table: keyof Database["public"]["Tables"], column: string) => {
      const { error } = await this.supabase.from(table).delete().eq(column, userId);
      if (error) throw error;
    };

    await deleteEq("roi_payouts", "user_id");
    await deleteEq("roi_investments", "user_id");
    await deleteEq("investments", "user_id");
    await deleteEq("withdrawals", "user_id");
    await deleteEq("payment_transactions", "user_id");
    await deleteEq("deposits", "user_id");

    const { data: wallets, error: walletListError } = await this.supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId);
    if (walletListError) throw walletListError;

    for (const wallet of wallets ?? []) {
      const { error } = await this.supabase.from("wallet_transactions").delete().eq("wallet_id", wallet.id);
      if (error) throw error;
    }

    await deleteEq("wallets", "user_id");
    const { error: referralsError } = await this.supabase
      .from("referrals")
      .delete()
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    if (referralsError) throw referralsError;
    await this.supabase.from("profiles").update({ referred_by: null }).eq("referred_by", userId);

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
        const message = error instanceof Error ? error.message : "Delete failed";
        results.push({ id, ok: false, error: message });
      }
    }
    return results;
  }

  async getMemberDetail(userId: string) {
    const { data: profile, error: profileError } = await this.supabase.from("profiles").select("*").eq("id", userId).single();
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
      profile,
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
