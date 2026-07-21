import type { DocumentItem } from "./types";

export function buildDocumentCatalog(input: {
  hasWalletActivity: boolean;
  hasInvestments: boolean;
  hasWelcomeBonus: boolean;
  hasReferrals: boolean;
}): DocumentItem[] {
  return [
    {
      id: "monthly-statement",
      category: "statements",
      title: "Account Statements",
      description: "Monthly summary of balances and wallet activity.",
      available: false,
      href: null
    },
    {
      id: "transaction-statement",
      category: "statements",
      title: "Transaction Statement",
      description: "Detailed ledger of wallet credits and debits.",
      available: input.hasWalletActivity,
      href: input.hasWalletActivity ? "/api/member/statements/transactions" : null
    },
    {
      id: "investment-summary",
      category: "reports",
      title: "Investment Summaries",
      description: "Active positions, earnings, and settlement history.",
      available: false,
      href: null
    },
    {
      id: "tax-documents",
      category: "tax",
      title: "Tax Documents",
      description: "Annual tax summaries and certificates when available.",
      available: false,
      href: null
    },
    {
      id: "bonus-statement",
      category: "bonus",
      title: "Welcome Bonus Statements",
      description: "Bonus allocation, qualification timeline, and unlock status.",
      available: input.hasWelcomeBonus,
      href: input.hasWelcomeBonus ? "/wallet" : null
    },
    {
      id: "referral-statement",
      category: "referral",
      title: "Referral Statements",
      description: "Referral commissions and payout history.",
      available: false,
      href: input.hasReferrals ? "/team" : null
    },
    {
      id: "security-logs",
      category: "security",
      title: "Security Logs",
      description: "Sign-in activity and security-related events.",
      available: true,
      href: "/settings"
    }
  ];
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentItem["category"], string> = {
  statements: "Statements",
  reports: "Reports",
  tax: "Tax Documents",
  bonus: "Welcome Bonus",
  referral: "Referrals",
  security: "Security"
};
