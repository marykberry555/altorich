import type { PaymentInitRequest, PaymentInitResponse, PaymentProvider, PaymentVerifyRequest, PaymentVerifyResponse } from "./types";

export class BankTransferProvider implements PaymentProvider {
  readonly name = "bank_transfer";

  constructor(
    private readonly bankConfig: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      narration: string;
    }
  ) {}

  async initialize(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    return {
      provider: this.name,
      reference: request.reference,
      bankDetails: {
        bankName: this.bankConfig.bankName,
        accountName: this.bankConfig.accountName,
        accountNumber: this.bankConfig.accountNumber,
        narration: this.bankConfig.narration
      }
    };
  }

  async verify(_request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    return {
      success: false,
      amount: 0,
      currency: "NGN",
      reference: _request.reference,
      provider: this.name,
      status: "pending"
    };
  }
}

export class FlutterwaveProvider implements PaymentProvider {
  readonly name = "flutterwave";

  async initialize(_request: PaymentInitRequest): Promise<PaymentInitResponse> {
    throw new Error("Flutterwave provider is not yet configured.");
  }

  async verify(_request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    throw new Error("Flutterwave provider is not yet configured.");
  }
}

export class MonnifyProvider implements PaymentProvider {
  readonly name = "monnify";

  async initialize(_request: PaymentInitRequest): Promise<PaymentInitResponse> {
    throw new Error("Monnify provider is not yet configured.");
  }

  async verify(_request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    throw new Error("Monnify provider is not yet configured.");
  }
}
