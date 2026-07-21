import type { PaymentProviderId } from "@/config/payment-rails";

export type PaymentProviderCapability = "deposit" | "withdrawal";

export type DepositIntentInput = {
  userId: string;
  amount: number;
  currency: string;
  asset?: string;
  network?: string;
  metadata?: Record<string, unknown>;
};

export type DepositIntentResult = {
  providerId: PaymentProviderId;
  status: "awaiting_transfer" | "pending_verification" | "not_configured";
  reference?: string;
  instructions?: string;
  receiveAddress?: string;
};

export type PayoutIntentInput = {
  userId: string;
  amount: number;
  currency: string;
  destination: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type PayoutIntentResult = {
  providerId: PaymentProviderId;
  status: "queued" | "not_configured";
  reference?: string;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  displayName: string;
  capabilities: PaymentProviderCapability[];
  configured: boolean;
  createDepositIntent(input: DepositIntentInput): Promise<DepositIntentResult>;
  createPayoutIntent(input: PayoutIntentInput): Promise<PayoutIntentResult>;
}

function notConfiguredProvider(
  id: PaymentProviderId,
  displayName: string,
  capabilities: PaymentProviderCapability[]
): PaymentProvider {
  return {
    id,
    displayName,
    capabilities,
    configured: false,
    async createDepositIntent() {
      return { providerId: id, status: "not_configured", instructions: `${displayName} is not configured.` };
    },
    async createPayoutIntent() {
      return { providerId: id, status: "not_configured" };
    }
  };
}

export const manualBankProvider: PaymentProvider = {
  id: "manual_bank",
  displayName: "Manual bank verification",
  capabilities: ["deposit", "withdrawal"],
  configured: true,
  async createDepositIntent(input) {
    return {
      providerId: "manual_bank",
      status: "awaiting_transfer",
      reference: `BANK-${input.userId.slice(0, 8)}`,
      instructions: "Transfer to the published bank account and submit proof."
    };
  },
  async createPayoutIntent() {
    return { providerId: "manual_bank", status: "queued" };
  }
};

export const manualCryptoProvider: PaymentProvider = {
  id: "manual_crypto",
  displayName: "Manual crypto verification",
  capabilities: ["deposit", "withdrawal"],
  configured: true,
  async createDepositIntent(input) {
    return {
      providerId: "manual_crypto",
      status: "awaiting_transfer",
      reference: `CRYPTO-${input.asset ?? "ASSET"}-${input.network ?? "NET"}`,
      instructions: "Send only the selected asset on the selected network, then submit your transaction reference."
    };
  },
  async createPayoutIntent() {
    return { providerId: "manual_crypto", status: "queued" };
  }
};

export const PAYMENT_PROVIDER_REGISTRY: Record<PaymentProviderId, PaymentProvider> = {
  manual_bank: manualBankProvider,
  manual_crypto: manualCryptoProvider,
  paystack: notConfiguredProvider("paystack", "Paystack", ["deposit"]),
  flutterwave: notConfiguredProvider("flutterwave", "Flutterwave", ["deposit"]),
  monnify: notConfiguredProvider("monnify", "Monnify", ["deposit"]),
  stripe: notConfiguredProvider("stripe", "Stripe", ["deposit"]),
  coinbase_commerce: notConfiguredProvider("coinbase_commerce", "Coinbase Commerce", ["deposit"]),
  binance_pay: notConfiguredProvider("binance_pay", "Binance Pay", ["deposit"]),
  nowpayments: notConfiguredProvider("nowpayments", "NowPayments", ["deposit", "withdrawal"]),
  yellow_card: notConfiguredProvider("yellow_card", "Yellow Card", ["deposit", "withdrawal"])
};

export function getPaymentProvider(id: PaymentProviderId): PaymentProvider {
  return PAYMENT_PROVIDER_REGISTRY[id];
}
