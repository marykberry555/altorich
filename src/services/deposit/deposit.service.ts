import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Deposit, Json } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { InvestmentService } from "@/services/investment/investment.service";
import { RoiService } from "@/services/roi/roi.service";
import { getPublicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export class DepositService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
  }

  async listRecent(limit = 20): Promise<Deposit[]> {
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async listForUser(userId: string, limit = 20): Promise<Deposit[]> {
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  async listPending(): Promise<Deposit[]> {
    const { data, error } = await this.supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(input: {
    memberName: string;
    phone: string;
    amount: number;
    reference: string;
    receiptNote: string;
    userId?: string;
    proofUrl?: string;
  }) {
    const { data, error } = await this.supabase
      .from("deposits")
      .insert({
        member_name: input.memberName,
        phone: input.phone,
        amount: input.amount,
        reference: input.reference,
        receipt_note: input.receiptNote,
        user_id: input.userId ?? null,
        proof_url: input.proofUrl ?? null,
        status: "pending"
      } as Database["public"]["Tables"]["deposits"]["Insert"])
      .select()
      .single();

    if (error) throw error;

    if (input.userId) {
      await this.notifications.dispatch({
        userId: input.userId,
        title: "Deposit submitted",
        body: `Your deposit of ₦${input.amount.toLocaleString("en-NG")} is pending verification.`,
        channel: "in_app",
        metadata: { deposit_id: data.id }
      });
    }

    return data;
  }

  private async resolveUserId(deposit: Deposit): Promise<string | null> {
    if (deposit.user_id) return deposit.user_id;

    const normalizedPhone = deposit.phone.replace(/\s+/g, "");
    const { data } = await this.supabase
      .from("profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    return data?.id ?? null;
  }

  async approve(depositId: string, reviewerId: string) {
    // Prefer row-locked claim RPC; fall back to conditional UPDATE if RPC unavailable.
    let deposit: Deposit | null = null;
    let claimed = false;
    let previousStatus = "pending";

    const { data: claimPayload, error: rpcError } = await this.supabase.rpc(
      "claim_deposit_for_approval" as never,
      { p_deposit_id: depositId, p_reviewer_id: reviewerId } as never
    );

    if (!rpcError && claimPayload && typeof claimPayload === "object") {
      const payload = claimPayload as {
        claimed?: boolean;
        previous_status?: string;
        deposit?: Deposit;
      };
      claimed = Boolean(payload.claimed);
      previousStatus = String(payload.previous_status ?? "unknown");
      deposit = payload.deposit ?? null;
    } else {
      const { data: claimedRow, error: claimError } = await this.supabase
        .from("deposits")
        .update({
          status: "approved",
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        } as Database["public"]["Tables"]["deposits"]["Update"])
        .eq("id", depositId)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (claimError) throw claimError;
      if (claimedRow) {
        deposit = claimedRow;
        claimed = true;
        previousStatus = "pending";
      } else {
        const { data: existing, error: existingError } = await this.supabase
          .from("deposits")
          .select("*")
          .eq("id", depositId)
          .maybeSingle();
        if (existingError) throw existingError;
        deposit = existing;
        previousStatus = String(existing?.status ?? "unknown");
      }
    }

    if (!deposit) {
      throw Errors.notFound("Deposit");
    }

    // Idempotent re-approval: return existing terminal/approved result without re-crediting.
    if (!claimed) {
      if (deposit.status === "approved" || deposit.status === "completed") {
        logger.info("Deposit approval idempotent hit", { depositId, status: deposit.status });
        return deposit;
      }
      throw new AppError("Deposit is not pending", 409, "INVALID_STATUS");
    }

    const userId = await this.resolveUserId(deposit);
    let walletTxId: string | null = deposit.wallet_transaction_id;

    if (userId) {
      const wallet = await this.wallet.getWalletByUserId(userId);
      const walletBefore = await this.wallet.getBalance(wallet.id);
      try {
        const tx = await this.wallet.creditDeposit(wallet.id, Number(deposit.amount), depositId);
        walletTxId = tx.id;
      } catch (creditError) {
        const message = creditError instanceof Error ? creditError.message : String(creditError);
        if (!/duplicate|unique/i.test(message)) throw creditError;
        const { data: existing } = await this.supabase
          .from("wallet_transactions")
          .select("id")
          .eq("reference", `DEP-${depositId}`)
          .maybeSingle();
        walletTxId = existing?.id ?? null;
      }

      await this.notifications.notifyEvent("deposit.approved", userId, {
        amount: Number(deposit.amount),
        deposit_id: depositId
      });

      if (getPublicEnv().NEXT_PUBLIC_ROI_MODE_ENABLED) {
        const roi = new RoiService(this.supabase);
        await roi.resetWeeklyCycle(userId).catch(() => null);
      }

      try {
        const investments = new InvestmentService(this.supabase);
        const created = await investments.autoInvestFromPreferredPackage(userId, Number(deposit.amount), {
          depositId,
          walletBefore
        });
        if (created) {
          logger.info("Auto-invested preferred package after deposit approval", {
            userId,
            depositId,
            investmentId: created.id,
            amount: Number(created.amount)
          });
        }
      } catch (autoInvestError) {
        const code =
          autoInvestError && typeof autoInvestError === "object" && "code" in autoInvestError
            ? String((autoInvestError as { code?: string }).code)
            : "";
        if (code === "LEDGER_RECONCILIATION_FAILED") {
          logger.error("Auto-invest rolled back after ledger reconciliation failure", {
            userId,
            depositId,
            error: autoInvestError instanceof Error ? autoInvestError.message : String(autoInvestError)
          });
        } else {
          logger.warn("Auto-invest after deposit approval skipped", {
            userId,
            depositId,
            error: autoInvestError instanceof Error ? autoInvestError.message : String(autoInvestError)
          });
        }
      }
    }

    const { data, error } = await this.supabase
      .from("deposits")
      .update({
        status: walletTxId ? "completed" : "approved",
        user_id: userId ?? deposit.user_id,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        wallet_transaction_id: walletTxId
      } as Database["public"]["Tables"]["deposits"]["Update"])
      .eq("id", depositId)
      .select()
      .single();

    if (error) throw error;

    logger.info("Deposit approved", {
      depositId,
      previousStatus,
      newStatus: data.status,
      walletTxId,
      reviewerId
    });

    return data;
  }

  async reject(depositId: string, reviewerId: string, reason: string) {
    const { data: deposit, error: fetchError } = await this.supabase
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .single();

    if (fetchError) throw fetchError;
    if (!deposit) throw Errors.notFound("Deposit");
    if (deposit.status !== "pending") {
      throw new AppError("Only pending deposits can be rejected.", 409, "DEPOSIT_NOT_PENDING");
    }

    const { data, error } = await this.supabase
      .from("deposits")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      } as Database["public"]["Tables"]["deposits"]["Update"])
      .eq("id", depositId)
      .eq("status", "pending")
      .select()
      .single();

    if (error) throw error;

    if (deposit.user_id) {
      await this.notifications.notifyEvent("deposit.rejected", deposit.user_id, {
        amount: Number(deposit.amount),
        reason: reason || "Your deposit could not be verified.",
        deposit_id: depositId
      });
    }

    return data;
  }

  async getUserStats(userId: string) {
    const deposits = await this.listForUser(userId, 500);
    const approved = deposits
      .filter((d) => d.status === "approved" || d.status === "completed")
      .reduce((s, d) => s + Number(d.amount), 0);
    const pending = deposits
      .filter((d) => d.status === "pending")
      .reduce((s, d) => s + Number(d.amount), 0);
    return { approved, pending, count: deposits.length };
  }

  async getAdminStats() {
    const deposits = await this.listRecent(500);
    const approved = deposits
      .filter((d) => d.status === "approved" || d.status === "completed")
      .reduce((s, d) => s + Number(d.amount), 0);
    const pending = deposits.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);
    const members = new Set(deposits.map((d) => d.phone)).size;
    return { approved, pending, members };
  }
}
