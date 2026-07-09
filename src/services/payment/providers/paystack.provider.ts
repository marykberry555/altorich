import type {
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentProvider,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
  WebhookVerifyResult
} from "./types";
import {
  isPaystackConfigured,
  parsePaystackWebhook,
  paystackEventId,
  paystackInitialize,
  paystackVerify,
  verifyPaystackWebhookSignature
} from "../paystack.client";

export class PaystackProvider implements PaymentProvider {
  readonly name = "paystack";

  private assertConfigured() {
    if (!isPaystackConfigured()) {
      throw new Error("Paystack is not configured. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.");
    }
  }

  async initialize(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    this.assertConfigured();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const result = await paystackInitialize({
      email: request.email,
      amount: request.amount,
      reference: request.reference,
      metadata: {
        user_id: request.userId,
        ...request.metadata
      },
      callbackUrl: `${siteUrl}/deposits?verify=${encodeURIComponent(request.reference)}`
    });

    if (!result.status) {
      throw new Error(result.message || "Paystack initialization failed.");
    }

    return {
      provider: this.name,
      reference: result.data.reference,
      checkoutUrl: result.data.authorization_url,
      accessCode: result.data.access_code
    };
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    this.assertConfigured();

    const result = await paystackVerify(request.reference);
    const data = result.data;

    const success = data.status === "success";
    const status =
      data.status === "success"
        ? "success"
        : data.status === "abandoned"
          ? "abandoned"
          : data.status === "pending"
            ? "pending"
            : "failed";

    return {
      success,
      amount: data.amount / 100,
      currency: data.currency,
      reference: data.reference,
      provider: this.name,
      providerReference: String(data.id),
      status
    };
  }

  verifyWebhook(rawBody: string, signature: string | null): WebhookVerifyResult {
    const valid = verifyPaystackWebhookSignature(rawBody, signature);
    const payload = parsePaystackWebhook(rawBody);
    const reference =
      typeof payload.data.reference === "string"
        ? payload.data.reference
        : typeof payload.data.transaction_reference === "string"
          ? payload.data.transaction_reference
          : undefined;

    return {
      valid,
      eventId: paystackEventId(payload),
      eventType: payload.event,
      reference,
      payload: payload as unknown as Record<string, unknown>
    };
  }
}
