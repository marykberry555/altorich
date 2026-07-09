import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError } from "@/lib/errors";
import { makeReference } from "@/lib/domain";
import { PaymentService, type PaymentProviderName } from "./payment.service";
import { DepositService } from "@/services/deposit/deposit.service";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { AuditService } from "@/services/audit/audit.service";
import { logger } from "@/lib/logger";
import type { WebhookVerifyResult } from "./providers/types";

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

  async initializePaystack(input: {
    userId: string;
    email: string;
    amount: number;
    memberName: string;
    phone: string;
  }) {
    const reference = makeReference(input.phone, "PSK");

    const { data: paymentTx, error: txError } = await this.supabase
      .from("payment_transactions")
      .insert({
        user_id: input.userId,
        provider: "paystack",
        reference,
        amount: input.amount,
        currency: "NGN",
        status: "initialized",
        metadata: { phone: input.phone } as Json
      })
      .select()
      .single();

    if (txError) throw txError;

    const deposit = await this.deposits.create({
      memberName: input.memberName,
      phone: input.phone,
      amount: input.amount,
      reference,
      receiptNote: `Paystack funding · ${reference}`,
      userId: input.userId
    });

    await this.supabase
      .from("deposits")
      .update({
        payment_provider: "paystack",
        payment_transaction_id: paymentTx.id,
        provider_reference: reference
      })
      .eq("id", deposit.id);

    await this.supabase.from("payment_transactions").update({ deposit_id: deposit.id }).eq("id", paymentTx.id);

    const provider = this.payments.getProvider("paystack");
    const init = await provider.initialize({
      userId: input.userId,
      email: input.email,
      amount: input.amount,
      currency: "NGN",
      reference,
      metadata: { deposit_id: deposit.id }
    });

    await this.supabase
      .from("payment_transactions")
      .update({
        status: "pending",
        checkout_url: init.checkoutUrl ?? null,
        provider_reference: init.accessCode ?? null
      })
      .eq("id", paymentTx.id);

    return {
      depositId: deposit.id,
      paymentTransactionId: paymentTx.id,
      reference,
      checkoutUrl: init.checkoutUrl,
      accessCode: init.accessCode
    };
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

      return { success: false, status: verified.status, reference };
    }

    return this.completeSuccessfulPayment(existing, verified.amount, verified.providerReference, actorId);
  }

  async processPaystackWebhook(rawBody: string, signature: string | null) {
    const provider = this.payments.getProvider("paystack");
    if (!provider.verifyWebhook) {
      throw new AppError("Webhook verification not supported.", 500, "NOT_CONFIGURED");
    }

    const result: WebhookVerifyResult = provider.verifyWebhook(rawBody, signature);

    const { data: existingEvent } = await this.supabase
      .from("webhook_events")
      .select("id, processed")
      .eq("provider", "paystack")
      .eq("event_id", result.eventId)
      .maybeSingle();

    if (existingEvent?.processed) {
      return { duplicate: true, eventId: result.eventId };
    }

    const { data: webhookRow, error: webhookError } = await this.supabase
      .from("webhook_events")
      .upsert(
        {
          provider: "paystack",
          event_id: result.eventId,
          event_type: result.eventType,
          reference: result.reference ?? null,
          payload: result.payload as Json,
          signature_valid: result.valid,
          processed: false
        },
        { onConflict: "provider,event_id" }
      )
      .select()
      .single();

    if (webhookError) throw webhookError;

    if (!result.valid) {
      await this.supabase
        .from("webhook_events")
        .update({ error_message: "Invalid signature", processed: true, processed_at: new Date().toISOString() })
        .eq("id", webhookRow.id);
      throw new AppError("Invalid webhook signature.", 401, "INVALID_SIGNATURE");
    }

    if (!result.reference) {
      await this.supabase
        .from("webhook_events")
        .update({ error_message: "Missing reference", processed: true, processed_at: new Date().toISOString() })
        .eq("id", webhookRow.id);
      return { ignored: true, reason: "no_reference" };
    }

    if (result.eventType === "charge.success") {
      await this.verifyAndCredit(result.reference, null);
    }

    await this.supabase
      .from("webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("id", webhookRow.id);

    logger.info("Paystack webhook processed", { eventId: result.eventId, reference: result.reference });
    return { processed: true, eventId: result.eventId, reference: result.reference };
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
