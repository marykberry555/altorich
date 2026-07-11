export const SMARTSUPP_EVENTS = {
  ACCOUNT_CREATED: "Account Created",
  LOGIN: "Login",
  WALLET_FUNDED: "Wallet Funded",
  INVESTMENT_STARTED: "Investment Started",
  INVESTMENT_COMPLETED: "Investment Completed",
  REFERRAL_EARNED: "Referral Earned",
  PAYOUT_REQUESTED: "Payout Requested",
  PAYOUT_APPROVED: "Payout Approved"
} as const;

export type SmartsuppEventName = (typeof SMARTSUPP_EVENTS)[keyof typeof SMARTSUPP_EVENTS];
