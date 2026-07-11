import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { hashPin, isValidPin } from "@/lib/auth/pin";
import { WalletService } from "@/services/wallet/wallet.service";

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

  async listMembers(page = 1, limit = 50, search?: string) {
    let query = this.supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      const term = search.trim();
      query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,invite_code.ilike.%${term}%,username.ilike.%${term}%`);
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
    const phone = input.phone.replace(/\s+/g, "").trim();

    const { data: existingUsername } = await this.supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (existingUsername) throw new AppError("Username is already taken.", 409, "USERNAME_TAKEN");

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
    if (error) throw error;
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

  async deleteMembers(userIds: string[]) {
    const results: { id: string; ok: boolean; error?: string }[] = [];
    for (const id of userIds) {
      const { error } = await this.supabase.auth.admin.deleteUser(id);
      results.push({ id, ok: !error, error: error?.message });
    }
    return results;
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
