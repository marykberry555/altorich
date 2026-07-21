/**
 * Canonical member-facing terminology.
 * Use these labels in UI copy and navigation — avoid mixing synonyms.
 */
export const MEMBER_TERMS = {
  member: "Member",
  deposit: "Deposit",
  deposits: "Deposits",
  withdrawal: "Withdrawal",
  withdrawals: "Withdrawals",
  wallet: "Wallet",
  investment: "Investment",
  investments: "Investments",
  portfolio: "Portfolio",
  investmentPortfolio: "Investment Portfolio",
  referral: "Referral",
  referrals: "Referrals",
  notification: "Notification",
  notifications: "Notifications",
  securityCenter: "Security Center",
  privacyCenter: "Privacy Center"
} as const;

export { PORTFOLIO_TERMS, formatInvestmentRange } from "@/lib/copy/portfolio-terminology";

/** Internal/code names that should not appear in member UI. */
export const AVOID_IN_MEMBER_UI = ["payout", "funding", "top-up", "top up", "cash out", "user", "customer", "client"] as const;
