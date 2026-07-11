import type { PaymentProvider } from "./providers/types";
import { BankTransferProvider } from "./providers";

export type PaymentProviderName = "bank_transfer";

export class PaymentService {
  private readonly providers: Map<PaymentProviderName, PaymentProvider>;

  constructor(bankConfig?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    narration: string;
  }) {
    this.providers = new Map();

    if (bankConfig) {
      this.providers.set("bank_transfer", new BankTransferProvider(bankConfig));
    } else {
      this.providers.set(
        "bank_transfer",
        new BankTransferProvider({
          bankName: "Configure in admin",
          accountName: "ALTORICH LTD",
          accountNumber: "00000000",
          narration: "Use your registered phone as narration"
        })
      );
    }
  }

  getProvider(name: PaymentProviderName): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Payment provider "${name}" is not registered.`);
    }
    return provider;
  }

  listProviders(): PaymentProviderName[] {
    return Array.from(this.providers.keys());
  }
}
