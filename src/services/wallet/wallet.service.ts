import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError } from "@/lib/errors";

type Client = SupabaseClient<Database>;
type WalletReason = Database["public"]["Tables"]["wallet_transactions"]["Insert"]["reason"];

export type LedgerEntry = {
  walletId: string;
  type: "credit" | "debit";
  amount: number;
  reference: string;
  reason: WalletReason;
  status?: "pending" | "completed" | "failed" | "reversed";
  metadata?: Record<string, unknown>;
};

export class WalletService {
  constructor(private readonly supabase: Client) {}

  async getWalletByUserId(userId: string, currency = "NGN") {
    const { data, error } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("currency", currency)
      .single();

    if (error) throw error;
    return data;
  }

  async getBalance(walletId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc("wallet_balance", { p_wallet_id: walletId });
    if (error) throw error;
    return Number(data ?? 0);
  }

  async getTransactions(walletId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  /** Ledger-only balance mutation — never update wallets.balance directly */
  async postTransaction(entry: LedgerEntry) {
    if (entry.amount <= 0) {
      throw new AppError("Transaction amount must be positive", 400, "INVALID_AMOUNT");
    }

    const { data, error } = await this.supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: entry.walletId,
        type: entry.type,
        amount: entry.amount,
        reference: entry.reference,
        reason: entry.reason,
        status: entry.status ?? "completed",
        metadata: (entry.metadata ?? {}) as Json
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async creditDeposit(walletId: string, amount: number, depositId: string) {
    return this.postTransaction({
      walletId,
      type: "credit",
      amount,
      reference: `DEP-${depositId}`,
      reason: "deposit",
      metadata: { deposit_id: depositId }
    });
  }

  async debitWithdrawal(walletId: string, amount: number, withdrawalId: string) {
    const balance = await this.getBalance(walletId);
    if (balance < amount) {
      throw new AppError("Insufficient wallet balance.", 400, "INSUFFICIENT_BALANCE");
    }

    return this.postTransaction({
      walletId,
      type: "debit",
      amount,
      reference: `WD-${withdrawalId}`,
      reason: "withdrawal",
      metadata: { withdrawal_id: withdrawalId }
    });
  }

  async debitInvestmentPurchase(walletId: string, amount: number, investmentId: string, reference: string) {
    const balance = await this.getBalance(walletId);
    if (balance < amount) {
      throw new AppError("Insufficient wallet balance for this investment.", 400, "INSUFFICIENT_BALANCE");
    }

    return this.postTransaction({
      walletId,
      type: "debit",
      amount,
      reference: `INV-PUR-${reference}`,
      reason: "investment_purchase",
      metadata: { investment_id: investmentId }
    });
  }

  async creditInvestmentSettlement(
    walletId: string,
    amount: number,
    investmentId: string,
    settlementId: string
  ) {
    return this.postTransaction({
      walletId,
      type: "credit",
      amount,
      reference: `INV-SET-${settlementId}`,
      reason: "investment_settlement",
      metadata: { investment_id: investmentId, settlement_id: settlementId }
    });
  }

  async adjust(walletId: string, amount: number, reference: string, metadata?: Record<string, unknown>) {
    const type = amount >= 0 ? "credit" : "debit";
    return this.postTransaction({
      walletId,
      type,
      amount: Math.abs(amount),
      reference,
      reason: "adjustment",
      metadata: { ...metadata, signed_amount: amount }
    });
  }

  async reverseTransaction(transactionId: string) {
    const { data: original, error: fetchError } = await this.supabase
      .from("wallet_transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError) throw fetchError;
    if (!original) throw new AppError("Transaction not found", 404, "NOT_FOUND");
    if (original.status === "reversed") {
      throw new AppError("Transaction already reversed", 409, "ALREADY_REVERSED");
    }

    const { error: updateError } = await this.supabase
      .from("wallet_transactions")
      .update({ status: "reversed" })
      .eq("id", transactionId);

    if (updateError) throw updateError;

    return this.postTransaction({
      walletId: original.wallet_id,
      type: original.type === "credit" ? "debit" : "credit",
      amount: Number(original.amount),
      reference: `REV-${original.reference}`,
      reason: "reversal",
      metadata: { reversed_transaction_id: transactionId }
    });
  }
}
