export type PaymentInitRequest = {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, unknown>;
};

export type PaymentInitResponse = {
  provider: string;
  reference: string;
  checkoutUrl?: string;
  accessCode?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    narration: string;
  };
};

export type PaymentVerifyRequest = {
  reference: string;
  providerReference?: string;
};

export type PaymentVerifyResponse = {
  success: boolean;
  amount: number;
  currency: string;
  reference: string;
  provider: string;
  providerReference?: string;
  status: "success" | "failed" | "pending" | "abandoned";
};

export type WebhookVerifyResult = {
  valid: boolean;
  eventId: string;
  eventType: string;
  reference?: string;
  payload: Record<string, unknown>;
};

export type RefundRequest = {
  reference: string;
  amount?: number;
  reason?: string;
};

export interface PaymentProvider {
  readonly name: string;
  initialize(request: PaymentInitRequest): Promise<PaymentInitResponse>;
  verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;
  verifyWebhook?(rawBody: string, signature: string | null): WebhookVerifyResult;
  refund?(request: RefundRequest): Promise<{ success: boolean; reference: string }>;
}
