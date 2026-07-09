import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Withdrawal } from "@/types/database";
import { AppError } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { KycService } from "@/services/kyc/kyc.service";

type Client = SupabaseClient<Database>;

export class WithdrawalService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;
  private readonly kyc: KycService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
    this.kyc = new KycService(supabase);
  }

  async listForUser(userId: string, limit = 50): Promise<Withdrawal[]> {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async listRecent(limit = 100): Promise<Withdrawal[]> {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async listPending(): Promise<Withdrawal[]> {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(input: {
    userId: string;
    amount: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
  }) {
    const kycCheck = await this.kyc.isWithdrawalAllowed(input.userId);
    if (!kycCheck.allowed) {
      throw new AppError(kycCheck.reason ?? "KYC verification required.", 403, "KYC_REQUIRED");
    }

    const wallet = await this.wallet.getWalletByUserId(input.userId);
    const balance = await this.wallet.getBalance(wallet.id);

    if (balance < input.amount) {
      throw new AppError("Insufficient wallet balance for withdrawal.", 400, "INSUFFICIENT_BALANCE");
    }

    const { data, error } = await this.supabase
      .from("withdrawals")
      .insert({
        user_id: input.userId,
        amount: input.amount,
        bank_name: input.bankName,
        account_name: input.accountName,
        account_number: input.accountNumber,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    await this.notifications.dispatch({
      userId: input.userId,
      title: "Withdrawal submitted",
      body: `Your withdrawal request of ₦${input.amount.toLocaleString("en-NG")} is pending review.`,
      channel: "in_app",
      metadata: { withdrawal_id: data.id }
    });

    return data;
  }

  async approve(withdrawalId: string, reviewerId: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (withdrawal.status !== "pending") {
      throw new AppError("Withdrawal is not pending", 409, "INVALID_STATUS");
    }

    const wallet = await this.wallet.getWalletByUserId(withdrawal.user_id);
    const tx = await this.wallet.debitWithdrawal(wallet.id, Number(withdrawal.amount), withdrawalId);

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        status: "paid",
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        wallet_transaction_id: tx.id
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .select()
      .single();

    if (error) throw error;

    await this.notifications.notifyEvent("withdrawal.approved", withdrawal.user_id, {
      amount: Number(withdrawal.amount),
      withdrawal_id: withdrawalId
    });

    return data;
  }

  async reject(withdrawalId: string, reviewerId: string, reason: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (withdrawal.status !== "pending") {
      throw new AppError("Withdrawal is not pending", 409, "INVALID_STATUS");
    }

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .select()
      .single();

    if (error) throw error;

    await this.notifications.notifyEvent("withdrawal.rejected", withdrawal.user_id, {
      amount: Number(withdrawal.amount),
      reason,
      withdrawal_id: withdrawalId
    });

    return data;
  }

  async cancel(withdrawalId: string, userId: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (withdrawal.status !== "pending") {
      throw new AppError("Only pending withdrawals can be cancelled.", 409, "INVALID_STATUS");
    }

    const { data, error } = await this.supabase
      .from("withdrawals")
      .update({ status: "cancelled" } as Database["public"]["Tables"]["withdrawals"]["Update"])
      .eq("id", withdrawalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
