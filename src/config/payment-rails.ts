/**
 * Payment Rails — version-controlled defaults.
 * Live operational state (enabled/disabled, addresses, messages) lives in
 * `settings.payment_rails` and is merged at runtime by PaymentRailsService.
 */

export const PAYMENT_RAILS_SETTINGS_KEY = "payment_rails" as const;
export const CRYPTO_WALLETS_SETTINGS_KEY = "crypto_wallets" as const;

export type PaymentRailId = "bank" | "crypto";
export type PaymentDirection = "deposit" | "withdrawal";
export type CryptoAssetCode = "USDT" | "USDC" | "BTC" | "ETH";
export type CryptoNetworkCode = "TRC20" | "ERC20" | "BEP20" | "POLYGON" | "BITCOIN";

export type PaymentProviderId =
  | "manual_bank"
  | "manual_crypto"
  | "paystack"
  | "flutterwave"
  | "monnify"
  | "stripe"
  | "coinbase_commerce"
  | "binance_pay"
  | "nowpayments"
  | "yellow_card";

export type RailDirectionConfig = {
  enabled: boolean;
  maintenanceMode: boolean;
  temporarilyUnavailable: boolean;
  displayMessage: string;
};

export type RailConfig = {
  id: PaymentRailId;
  displayName: string;
  priority: number;
  deposit: RailDirectionConfig;
  withdrawal: RailDirectionConfig;
  supportedCurrencies: string[];
  processingInstructions: string;
  providerIds: PaymentProviderId[];
};

export type CryptoAssetConfig = {
  code: CryptoAssetCode;
  displayName: string;
  enabled: boolean;
  networks: CryptoNetworkCode[];
  decimals: number;
};

export type CryptoNetworkConfig = {
  code: CryptoNetworkCode;
  displayName: string;
  enabled: boolean;
  warning: string;
};

export type PlatformCryptoAddress = {
  asset: CryptoAssetCode;
  network: CryptoNetworkCode;
  address: string;
  label?: string;
};

export type PaymentRailsDefaults = {
  version: 1;
  rails: Record<PaymentRailId, RailConfig>;
  cryptoAssets: CryptoAssetConfig[];
  cryptoNetworks: CryptoNetworkConfig[];
  /** Platform receive addresses (defaults empty — set via admin / settings.crypto_wallets). */
  platformAddresses: PlatformCryptoAddress[];
  bothDepositsDisabledMessage: string;
  bothWithdrawalsDisabledMessage: string;
  cryptoOnlyWithdrawalMessage: string;
  bankOnlyWithdrawalMessage: string;
  providers: Array<{
    id: PaymentProviderId;
    displayName: string;
    configured: boolean;
    capabilities: Array<"deposit" | "withdrawal">;
  }>;
};

/** Partial live overlay stored in settings.payment_rails */
export type PaymentRailsLiveState = {
  version?: 1;
  rails?: Partial<
    Record<
      PaymentRailId,
      Partial<{
        displayName: string;
        priority: number;
        deposit: Partial<RailDirectionConfig>;
        withdrawal: Partial<RailDirectionConfig>;
        processingInstructions: string;
      }>
    >
  >;
  cryptoAssets?: Array<Partial<CryptoAssetConfig> & { code: CryptoAssetCode }>;
  cryptoNetworks?: Array<Partial<CryptoNetworkConfig> & { code: CryptoNetworkCode }>;
  platformAddresses?: PlatformCryptoAddress[];
  bothDepositsDisabledMessage?: string;
  bothWithdrawalsDisabledMessage?: string;
  cryptoOnlyWithdrawalMessage?: string;
  bankOnlyWithdrawalMessage?: string;
  /** Optional admin note from last change */
  lastChangeReason?: string | null;
};

export type ResolvedPaymentRails = PaymentRailsDefaults & {
  /** Convenience flags after merge + legacy mapping */
  bankDepositOpen: boolean;
  bankWithdrawalOpen: boolean;
  cryptoDepositOpen: boolean;
  cryptoWithdrawalOpen: boolean;
  anyDepositOpen: boolean;
  anyWithdrawalOpen: boolean;
};

const railDirection = (enabled: boolean, message = ""): RailDirectionConfig => ({
  enabled,
  maintenanceMode: false,
  temporarilyUnavailable: false,
  displayMessage: message
});

/** Fixed member-facing crypto catalog — not toggled per-asset in admin. */
export const SUPPORTED_CRYPTO_ASSETS: CryptoAssetConfig[] = [
  { code: "USDT", displayName: "Tether (USDT)", enabled: true, networks: ["TRC20", "ERC20", "BEP20"], decimals: 6 },
  { code: "USDC", displayName: "USD Coin (USDC)", enabled: true, networks: ["ERC20", "BEP20", "POLYGON"], decimals: 6 },
  { code: "BTC", displayName: "Bitcoin (BTC)", enabled: true, networks: ["BITCOIN"], decimals: 8 },
  { code: "ETH", displayName: "Ethereum (ETH)", enabled: true, networks: ["ERC20"], decimals: 18 }
];

export const SUPPORTED_CRYPTO_NETWORKS: CryptoNetworkConfig[] = [
  {
    code: "TRC20",
    displayName: "TRON (TRC20)",
    enabled: true,
    warning: "Send only TRC20 tokens to this address. ERC20 or BEP20 will be lost."
  },
  {
    code: "ERC20",
    displayName: "Ethereum (ERC20)",
    enabled: true,
    warning: "Use the Ethereum network only. High gas fees may apply."
  },
  {
    code: "BEP20",
    displayName: "BNB Smart Chain (BEP20)",
    enabled: true,
    warning: "Use BNB Smart Chain only. Do not send from TRON or Ethereum."
  },
  {
    code: "POLYGON",
    displayName: "Polygon",
    enabled: true,
    warning: "Use the Polygon network only."
  },
  {
    code: "BITCOIN",
    displayName: "Bitcoin",
    enabled: true,
    warning: "Send only BTC on the Bitcoin network."
  }
];

export function networksForAsset(asset: CryptoAssetCode): CryptoNetworkCode[] {
  return SUPPORTED_CRYPTO_ASSETS.find((a) => a.code === asset)?.networks ?? [];
}

export const DEFAULT_PAYMENT_RAILS: PaymentRailsDefaults = {
  version: 1,
  rails: {
    bank: {
      id: "bank",
      displayName: "Bank transfer",
      priority: 1,
      deposit: railDirection(true),
      withdrawal: railDirection(true),
      supportedCurrencies: ["NGN"],
      processingInstructions:
        "Send the exact amount to the published bank account, then submit your transfer reference for verification.",
      providerIds: ["manual_bank", "paystack", "flutterwave", "monnify"]
    },
    crypto: {
      id: "crypto",
      displayName: "Cryptocurrency",
      priority: 2,
      deposit: railDirection(false, "Crypto deposits are currently unavailable."),
      withdrawal: railDirection(false, "Crypto withdrawals are currently unavailable."),
      supportedCurrencies: ["USDT", "USDC", "BTC", "ETH"],
      processingInstructions:
        "Send only the selected asset on the selected network. Wrong network transfers may be unrecoverable.",
      providerIds: ["manual_crypto", "nowpayments", "coinbase_commerce", "binance_pay", "yellow_card"]
    }
  },
  cryptoAssets: structuredClone(SUPPORTED_CRYPTO_ASSETS),
  cryptoNetworks: structuredClone(SUPPORTED_CRYPTO_NETWORKS),
  platformAddresses: [],
  bothDepositsDisabledMessage:
    "Deposits are temporarily unavailable. Please check back shortly or contact support.",
  bothWithdrawalsDisabledMessage:
    "Withdrawals are temporarily unavailable. Please check back shortly or contact support.",
  cryptoOnlyWithdrawalMessage:
    "Payouts are currently processed through cryptocurrency only. Bank withdrawals are not available right now.",
  bankOnlyWithdrawalMessage:
    "Payouts are currently processed through bank transfer only. Crypto withdrawals are not available right now.",
  providers: [
    { id: "manual_bank", displayName: "Manual bank verification", configured: true, capabilities: ["deposit", "withdrawal"] },
    { id: "manual_crypto", displayName: "Manual crypto verification", configured: true, capabilities: ["deposit", "withdrawal"] },
    { id: "paystack", displayName: "Paystack", configured: false, capabilities: ["deposit"] },
    { id: "flutterwave", displayName: "Flutterwave", configured: false, capabilities: ["deposit"] },
    { id: "monnify", displayName: "Monnify", configured: false, capabilities: ["deposit"] },
    { id: "stripe", displayName: "Stripe", configured: false, capabilities: ["deposit"] },
    { id: "coinbase_commerce", displayName: "Coinbase Commerce", configured: false, capabilities: ["deposit"] },
    { id: "binance_pay", displayName: "Binance Pay", configured: false, capabilities: ["deposit"] },
    { id: "nowpayments", displayName: "NowPayments", configured: false, capabilities: ["deposit", "withdrawal"] },
    { id: "yellow_card", displayName: "Yellow Card", configured: false, capabilities: ["deposit", "withdrawal"] }
  ]
};
