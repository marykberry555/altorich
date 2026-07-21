import { REFERRAL_WALLET_CURRENCY } from "@/services/wallet/wallet.service";
import { WELCOME_BONUS_WALLET_CURRENCY } from "@/lib/welcome-bonus/config";
import type { WalletKind, WalletTransactionView } from "./types";

export function walletKindFromCurrency(currency: string): WalletKind {
  if (currency === WELCOME_BONUS_WALLET_CURRENCY) return "welcome_bonus";
  if (currency === REFERRAL_WALLET_CURRENCY) return "referral";
  return "ngn";
}

export function walletKindLabel(kind: WalletKind) {
  switch (kind) {
    case "welcome_bonus":
      return "Welcome Bonus Wallet";
    case "referral":
      return "Referral Wallet";
    default:
      return "NGN Wallet";
  }
}

export function classifyTransactionType(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("deposit") || r === "deposit") return "Deposit";
  if (r.includes("withdraw")) return "Withdrawal";
  if (r.includes("invest") || r.includes("allocation")) return "Investment";
  if (r.includes("settlement") || r.includes("earning") || r.includes("roi")) return "ROI";
  if (r.includes("referral")) return "Referral";
  if (r.includes("welcome bonus") || r.includes("bonus")) return "Welcome Bonus";
  if (r.includes("adjust")) return "Adjustment";
  return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function inferSourceDestination(input: {
  type: "credit" | "debit";
  reason: string;
  walletKind: WalletKind;
  metadata?: Record<string, unknown>;
}): { source: string | null; destination: string | null } {
  const label = walletKindLabel(input.walletKind);
  const r = input.reason.toLowerCase();

  if (input.type === "credit") {
    if (r.includes("deposit")) return { source: "Bank transfer", destination: label };
    if (r.includes("referral")) return { source: "Referral programme", destination: label };
    if (r.includes("bonus")) return { source: "Welcome bonus programme", destination: label };
    if (r.includes("settlement") || r.includes("earning")) return { source: "Investment settlement", destination: label };
    return { source: "Alto Rich", destination: label };
  }

  if (r.includes("withdraw")) return { source: label, destination: "Your bank account" };
  if (r.includes("invest")) return { source: label, destination: "Investment portfolio" };
  return { source: label, destination: "Alto Rich" };
}

export function mapWalletTransaction(row: {
  id: string;
  type: "credit" | "debit";
  amount: number;
  reference: string;
  reason: string;
  status: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  currency?: string;
}): WalletTransactionView {
  const walletKind = walletKindFromCurrency(row.currency ?? "NGN");
  const { source, destination } = inferSourceDestination({
    type: row.type,
    reason: row.reason,
    walletKind,
    metadata: row.metadata ?? undefined
  });

  return {
    id: row.id,
    walletKind,
    walletLabel: walletKindLabel(walletKind),
    type: row.type,
    amount: Number(row.amount),
    reason: row.reason,
    transactionType: classifyTransactionType(row.reason),
    reference: row.reference,
    status: row.status,
    created_at: row.created_at,
    source,
    destination,
    metadata: row.metadata ?? undefined
  };
}
