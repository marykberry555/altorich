export type MemberCryptoWallet = {
  id: string;
  asset: string;
  network: string;
  address: string;
  label?: string;
  isDefault?: boolean;
};

export type MemberPayoutPreferences = {
  preferredMethod?: "bank" | "crypto";
  preferredAsset?: string;
  preferredNetwork?: string;
  cryptoWallets?: MemberCryptoWallet[];
};

export type ExtendedNotificationPreferences = {
  in_app?: boolean;
  email?: boolean;
  sms?: boolean;
  payout?: MemberPayoutPreferences;
};

export function readPayoutPreferences(raw: unknown): MemberPayoutPreferences {
  if (!raw || typeof raw !== "object") return {};
  const payout = (raw as ExtendedNotificationPreferences).payout;
  if (!payout || typeof payout !== "object") return {};
  return {
    preferredMethod: payout.preferredMethod === "crypto" ? "crypto" : payout.preferredMethod === "bank" ? "bank" : undefined,
    preferredAsset: typeof payout.preferredAsset === "string" ? payout.preferredAsset : undefined,
    preferredNetwork: typeof payout.preferredNetwork === "string" ? payout.preferredNetwork : undefined,
    cryptoWallets: Array.isArray(payout.cryptoWallets)
      ? payout.cryptoWallets.filter(
          (w): w is MemberCryptoWallet =>
            Boolean(w && typeof w === "object" && typeof w.id === "string" && typeof w.address === "string")
        )
      : []
  };
}

export function encodeCryptoDepositNote(input: {
  asset: string;
  network: string;
  paymentReference: string;
}) {
  return `[CRYPTO:${input.asset}:${input.network}] ${input.paymentReference}`.slice(0, 120);
}

export function encodeCryptoWithdrawalFields(input: {
  asset: string;
  network: string;
  address: string;
}) {
  return {
    bankName: `CRYPTO-${input.asset}`,
    accountName: `${input.asset}/${input.network}`,
    accountNumber: input.address.slice(0, 20)
  };
}
