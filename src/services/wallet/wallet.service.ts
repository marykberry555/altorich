import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError } from "@/lib/errors";

type Client = SupabaseClient<Database>;
type WalletReason = Database["public"]["Tables"]["wallet_transactions"]["Insert"]["reason"];

/** Separate referral rewards ledger — never mixed with NGN investment wallet */
export const REFERRAL_WALLET_CURRENCY = "REF";

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
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new AppError(
        `Wallet not found for user (${currency}).`,
        404,
        "WALLET_NOT_FOUND",
        "This member does not have a wallet yet. Try again — one will be created automatically."
      );
    }
    return data;
  }

  /** Get or create a wallet for the member (NGN / REF / welcome-bonus currencies). */
  async ensureWallet(userId: string, currency = "NGN") {
    const { data: existing, error: existingError } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("currency", currency)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) return existing;

    const { data: created, error: insertError } = await this.supabase
      .from("wallets")
      .insert({ user_id: userId, currency })
      .select("*")
      .single();

    if (!insertError && created) return created;

    // Concurrent create race — unique (user_id, currency) — re-fetch.
    const message = insertError?.message ?? "";
    if (/duplicate|unique/i.test(message)) {
      const { data: raced, error: raceError } = await this.supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("currency", currency)
        .maybeSingle();
      if (raceError) throw raceError;
      if (raced) return raced;
    }

    if (insertError) throw insertError;
    throw new AppError("Could not create wallet.", 500, "WALLET_CREATE_FAILED");
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

  async debitWithdrawal(
    walletId: string,
    amount: number,
    withdrawalId: string,
    settlementReference?: string | null
  ) {
    const balance = await this.getBalance(walletId);
    if (balance < amount) {
      throw new AppError("Insufficient wallet balance.", 400, "INSUFFICIENT_BALANCE");
    }

    return this.postTransaction({
      walletId,
      type: "debit",
      amount,
      reference: settlementReference?.trim() || `WD-${withdrawalId}`,
      reason: "withdrawal",
      metadata: {
        withdrawal_id: withdrawalId,
        settlement_reference: settlementReference ?? null,
        ledger_label: "Withdrawal Paid"
      }
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

  async creditReferralCommission(
    walletId: string,
    amount: number,
    referralRef: string,
    metadata?: Record<string, unknown>
  ) {
    // Stable reference — never append timestamps (exactly-once on retries).
    const reference = `REF-CR-${referralRef}`;
    try {
      return await this.postTransaction({
        walletId,
        type: "credit",
        amount,
        reference,
        reason: "referral_commission",
        metadata: {
          ...metadata,
          wallet_purpose: "referral",
          ledger_event: "referral_commission_earned",
          ledger_label: "Referral Commission Earned"
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate|unique/i.test(message)) throw error;
      const { data: existing } = await this.supabase
        .from("wallet_transactions")
        .select("*")
        .eq("reference", reference)
        .maybeSingle();
      if (!existing) throw error;
      return existing;
    }
  }

  async debitReferralPayout(walletId: string, amount: number, payoutId: string) {
    const balance = await this.getBalance(walletId);
    if (balance < amount) {
      throw new AppError("Insufficient referral wallet balance.", 400, "INSUFFICIENT_BALANCE");
    }

    return this.postTransaction({
      walletId,
      type: "debit",
      amount,
      reference: `REF-PAYOUT-${payoutId}`,
      reason: "withdrawal",
      status: "pending",
      metadata: {
        referral_payout_id: payoutId,
        wallet_purpose: "referral",
        ledger_event: "referral_withdrawal_requested",
        ledger_label: "Referral Withdrawal Requested"
      }
    });
  }

  async completeReferralPayoutDebit(transactionId: string, extraMetadata?: Record<string, unknown>) {
    const { data: existing } = await this.supabase
      .from("wallet_transactions")
      .select("metadata")
      .eq("id", transactionId)
      .maybeSingle();

    const metadata = {
      ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
      ...extraMetadata,
      ledger_event: "referral_withdrawal_paid",
      ledger_label: "Referral Withdrawal Paid"
    };

    const { error } = await this.supabase
      .from("wallet_transactions")
      .update({ status: "completed", metadata })
      .eq("id", transactionId);
    if (error) throw error;
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
