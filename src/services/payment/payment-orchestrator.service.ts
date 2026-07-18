import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError } from "@/lib/errors";
import { PaymentService, type PaymentProviderName } from "./payment.service";
import { DepositService } from "@/services/deposit/deposit.service";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { AuditService } from "@/services/audit/audit.service";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export class PaymentOrchestratorService {
  private readonly payments: PaymentService;
  private readonly deposits: DepositService;
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;
  private readonly audit: AuditService;

  constructor(
    private readonly supabase: Client,
    bankConfig?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      narration: string;
    }
  ) {
    this.payments = new PaymentService(bankConfig);
    this.deposits = new DepositService(supabase);
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
    this.audit = new AuditService(supabase);
  }

  async verifyAndCredit(reference: string, actorId?: string | null) {
    const existing = await this.findPaymentByReference(reference);
    if (!existing) {
      throw new AppError("Payment not found.", 404, "NOT_FOUND");
    }

    if (existing.status === "success") {
      return { alreadyProcessed: true, reference };
    }

    const provider = this.payments.getProvider(existing.provider as PaymentProviderName);
    const verified = await provider.verify({ reference });

    if (!verified.success) {
      await this.supabase
        .from("payment_transactions")
        .update({ status: verified.status === "abandoned" ? "abandoned" : "failed" })
        .eq("id", existing.id);

      if (existing.deposit_id) {
        await this.supabase
          .from("deposits")
          .update({ status: "rejected", rejection_reason: `Payment ${verified.status}` })
          .eq("id", existing.deposit_id)
          .eq("status", "pending");
      }

      try {
        const { AdminNotificationService } = await import("@/services/admin/admin-notification.service");
        await new AdminNotificationService(this.supabase).create({
          eventType: "payment.failed",
          title: "Failed payment processing",
          body: `Payment ${reference} marked ${verified.status}.`,
          entityType: "payment_transactions",
          entityId: existing.id,
          metadata: {
            priority: "high",
            reference,
            status: verified.status,
            user_id: existing.user_id
          }
        });
      } catch {
        // non-blocking
      }

      return { success: false, status: verified.status, reference };
    }

    return this.completeSuccessfulPayment(existing, verified.amount, verified.providerReference, actorId);
  }

  private async findPaymentByReference(reference: string) {
    const { data } = await this.supabase
      .from("payment_transactions")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    return data;
  }

  private async completeSuccessfulPayment(
    paymentTx: Database["public"]["Tables"]["payment_transactions"]["Row"],
    amount: number,
    providerReference?: string,
    actorId?: string | null
  ) {
    if (Number(paymentTx.amount) !== amount) {
      logger.error("Payment amount mismatch", {
        reference: paymentTx.reference,
        expected: paymentTx.amount,
        received: amount
      });
      throw new AppError("Payment amount mismatch.", 409, "AMOUNT_MISMATCH");
    }

    const { data: locked } = await this.supabase
      .from("payment_transactions")
      .update({
        status: "success",
        provider_reference: providerReference ?? paymentTx.provider_reference,
        verified_at: new Date().toISOString()
      })
      .eq("id", paymentTx.id)
      .neq("status", "success")
      .select()
      .single();

    if (!locked) {
      return { alreadyProcessed: true, reference: paymentTx.reference };
    }

    let walletTxId: string | null = null;

    if (paymentTx.deposit_id) {
      const wallet = await this.wallet.getWalletByUserId(paymentTx.user_id);
      const tx = await this.wallet.creditDeposit(wallet.id, amount, paymentTx.deposit_id);
      walletTxId = tx.id;

      await this.supabase
        .from("deposits")
        .update({
          status: "completed",
          wallet_transaction_id: walletTxId,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", paymentTx.deposit_id);
    }

    await this.notifications.notifyEvent("payment.received", paymentTx.user_id, {
      amount,
      payment_reference: paymentTx.reference,
      deposit_id: paymentTx.deposit_id
    });

    await this.audit.log({
      actorId: actorId ?? null,
      action: "payment.completed",
      entityType: "payment_transaction",
      entityId: paymentTx.id,
      metadata: { reference: paymentTx.reference, amount, wallet_transaction_id: walletTxId }
    });

    return { success: true, reference: paymentTx.reference, walletTransactionId: walletTxId };
  }
}
