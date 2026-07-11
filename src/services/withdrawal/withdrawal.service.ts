import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Withdrawal } from "@/types/database";
import { AppError } from "@/lib/errors";
import { formatPayoutScheduleMessage, resolvePayoutQueue } from "@/lib/payout/schedule";
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
      .in("status", ["pending", "scheduled"])
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
    bankAccountId?: string | null;
    note?: string | null;
    requestType?: "manual" | "automatic";
    asOf?: Date;
  }) {
    const kycCheck = await this.kyc.isWithdrawalAllowed(input.userId);
    if (!kycCheck.allowed) {
      throw new AppError(kycCheck.reason ?? "KYC verification required.", 403, "KYC_REQUIRED");
    }

    const wallet = await this.wallet.getWalletByUserId(input.userId);
    const balance = await this.wallet.getBalance(wallet.id);

    if (balance < input.amount) {
      throw new AppError("Insufficient wallet balance for payout.", 400, "INSUFFICIENT_BALANCE");
    }

    const requestType = input.requestType ?? "manual";

    if (requestType === "manual") {
      const { count: pendingCount } = await this.supabase
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", input.userId)
        .in("status", ["pending", "scheduled"]);

      if ((pendingCount ?? 0) > 0) {
        throw new AppError("You already have an open payout request.", 409, "PENDING_EXISTS");
      }
    } else {
      const { count: autoCount } = await this.supabase
        .from("withdrawals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", input.userId)
        .eq("request_type", "automatic")
        .in("status", ["pending", "scheduled"]);

      if ((autoCount ?? 0) > 0) {
        return null;
      }
    }

    const queue = resolvePayoutQueue({ now: input.asOf });
    const status = requestType === "automatic" && queue.status === "pending" ? "pending" : queue.status;

    const { data, error } = await this.supabase
      .from("withdrawals")
      .insert({
        user_id: input.userId,
        amount: input.amount,
        bank_name: input.bankName,
        account_name: input.accountName,
        account_number: input.accountNumber,
        bank_account_id: input.bankAccountId ?? null,
        note: input.note ?? null,
        request_type: requestType,
        scheduled_at: queue.scheduledAt.toISOString(),
        status
      })
      .select()
      .single();

    if (error) throw error;

    if (!data) return null;

    const event = requestType === "automatic" ? "withdrawal.auto_created" : "withdrawal.submitted";
    await this.notifications.notifyEvent(event, input.userId, {
      amount: input.amount,
      withdrawal_id: data.id,
      scheduled_at: queue.scheduledAt.toISOString(),
      schedule_message: formatPayoutScheduleMessage(queue.scheduledAt)
    });

    return data;
  }

  async createAutomaticFromSettlement(input: {
    userId: string;
    amount: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankAccountId?: string | null;
    asOf?: Date;
  }) {
    if (input.amount <= 0) return null;
    return this.create({
      ...input,
      requestType: "automatic",
      note: "Automatic weekly earnings payout"
    });
  }

  async promoteScheduledWithdrawals(asOf = new Date()) {
    const { data, error } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", asOf.toISOString());

    if (error) throw error;

    for (const withdrawal of data ?? []) {
      await this.supabase
        .from("withdrawals")
        .update({ status: "pending" } as Database["public"]["Tables"]["withdrawals"]["Update"])
        .eq("id", withdrawal.id);

      await this.notifications.notifyEvent("withdrawal.submitted", withdrawal.user_id, {
        amount: Number(withdrawal.amount),
        withdrawal_id: withdrawal.id
      });
    }

    return data?.length ?? 0;
  }

  async approve(withdrawalId: string, reviewerId: string) {
    const { data: withdrawal, error: fetchError } = await this.supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;
    if (!withdrawal) throw new AppError("Withdrawal not found", 404, "NOT_FOUND");
    if (withdrawal.status !== "pending" && withdrawal.status !== "scheduled") {
      throw new AppError("Withdrawal is not pending", 409, "INVALID_STATUS");
    }

    if (withdrawal.status === "scheduled") {
      await this.supabase
        .from("withdrawals")
        .update({ status: "pending" } as Database["public"]["Tables"]["withdrawals"]["Update"])
        .eq("id", withdrawalId);
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

    await this.notifications.notifyEvent("withdrawal.paid", withdrawal.user_id, {
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
    if (!["pending", "scheduled"].includes(withdrawal.status)) {
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
    if (!["pending", "scheduled"].includes(withdrawal.status)) {
      throw new AppError("Only open payout requests can be cancelled.", 409, "INVALID_STATUS");
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
