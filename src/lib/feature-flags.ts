export type FeatureFlags = {
  kyc_required: boolean;
  enable_usdt: boolean;
  enable_usdc: boolean;
  enable_bitcoin: boolean;
  enable_crypto_funding: boolean;
  enable_crypto_payouts: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  kyc_required: false,
  enable_usdt: false,
  enable_usdc: false,
  enable_bitcoin: false,
  enable_crypto_funding: false,
  enable_crypto_payouts: false
};

export function mergeFeatureFlags(partial: Partial<FeatureFlags> | null | undefined): FeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS, ...partial };
}
