export const MIN_FUNDING_AMOUNT_NGN = 1_000;

export type FundingPaymentMethod = "bank_transfer" | "crypto";

export type CryptoAsset = "usdt" | "usdc" | "btc";

export type PayoutMethod = "bank" | "usdt" | "usdc" | "btc";

export type CryptoWalletConfig = {
  usdt: { network: string; address: string };
  usdc: { network: string; address: string };
  btc: { address: string };
};

export const PAYOUT_METHODS: { id: PayoutMethod; label: string; short: string }[] = [
  { id: "bank", label: "Bank Account", short: "Bank" },
  { id: "usdt", label: "USDT", short: "USDT" },
  { id: "usdc", label: "USDC", short: "USDC" },
  { id: "btc", label: "Bitcoin (BTC)", short: "BTC" }
];

export function payoutMethodLabel(method: PayoutMethod) {
  return PAYOUT_METHODS.find((m) => m.id === method)?.label ?? method;
}

export function formatPayoutDestination(row: { bank_name: string; account_number: string }) {
  return `${row.bank_name} · ${row.account_number}`;
}
