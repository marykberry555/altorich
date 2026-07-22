import { INVESTMENT_PORTFOLIOS } from "@/config/investment-portfolios";
import { COMPANY } from "@/lib/company";

export const HOW_IT_WORKS_PAGE = {
  path: "/how-it-works",
  hero: {
    eyebrow: "How Alto Rich works",
    title: "Understand how we operate — clearly and confidently.",
    description:
      "A high-level guide to registration, funding, portfolio allocation, settlement, and tracking. Written for prospective and current members — without confidential operational detail or unsupported claims."
  },
  cta: {
    primary: { label: "Start investing", href: "/auth/register" },
    secondary: { label: "Explore portfolios", href: "/packages" },
    transparency: { label: "Transparency Center", href: "/company/transparency" }
  }
} as const;

export const MEMBER_JOURNEY_STEPS = [
  {
    id: "register",
    title: "Member registers",
    description: "Create your account with email and phone. Your profile is the foundation for verification and portfolio preferences."
  },
  {
    id: "verify-email",
    title: "Email verification",
    description: "Confirm your email address to activate core account features and secure communication."
  },
  {
    id: "choose-portfolio",
    title: "Choose investment portfolio",
    description: "Select a preferred portfolio that matches your allocation goals. You can review all four portfolios before funding."
  },
  {
    id: "fund",
    title: "Fund account",
    description: "Transfer naira from your Nigerian bank to the published receiving account shown in your dashboard."
  },
  {
    id: "deposit-verify",
    title: "Deposit verification",
    description: "Submit your transfer reference. An administrator reconciles the bank credit before funds appear in your wallet."
  },
  {
    id: "investment-active",
    title: "Investment activated",
    description: "Allocate from your wallet to your chosen portfolio. Your allocation is recorded on your auditable ledger."
  },
  {
    id: "returns-accrue",
    title: "Returns accrue",
    description: "Published portfolio parameters determine how earnings are calculated and reflected in your dashboard — illustrative projections are not guarantees."
  },
  {
    id: "withdrawal-request",
    title: "Withdrawal request",
    description: "Request a withdrawal during published review windows. Requests are verified before processing."
  },
  {
    id: "weekly-settlement",
    title: "Weekly settlement",
    description: "Settlements follow a structured Monday schedule with reconciliation and ledger updates you can track in your account."
  }
] as const;

export const CAPITAL_ALLOCATION = {
  eyebrow: "Capital allocation",
  title: "Professionally managed portfolio strategies",
  description:
    "Alto Rich allocates capital across professionally managed investment strategies aligned with the portfolio you select. Each portfolio has a defined strategic focus — not a promise that every naira is deployed into one named project.",
  disclaimer:
    "Portfolio descriptions reflect strategic focus areas. They do not represent direct, individual project ownership for every member allocation. Operational deployment details remain confidential.",
  portfolios: INVESTMENT_PORTFOLIOS.map((p) => ({
    slug: p.slug,
    name: p.name,
    strategy: p.strategy,
    summary: p.description,
    dailyReturnRate: p.dailyReturnRate,
    minimumInvestment: p.minimumInvestment,
    maximumInvestment: p.maximumInvestment,
    href: `/packages/${p.slug}`
  }))
} as const;

export const WEEKLY_SETTLEMENT_REASONS = {
  eyebrow: "Settlement rhythm",
  title: "Why weekly settlements?",
  description:
    "Structured settlement cycles support disciplined operations — not urgency or hype. Here is why Alto Rich uses a published weekly rhythm:",
  reasons: [
    {
      title: "Efficient reconciliation",
      description: "A defined cycle gives operations time to match bank credits, allocations, and ledger entries accurately."
    },
    {
      title: "Operational verification",
      description: "Each settlement window includes review steps before balances are updated for members."
    },
    {
      title: "Accurate ledger management",
      description: "Weekly batches keep transaction history orderly and easier to audit internally and for members to follow."
    },
    {
      title: "Consistent member processing",
      description: "Members know when to expect settlement activity instead of unpredictable, ad-hoc timing."
    },
    {
      title: "Professional financial controls",
      description: "Structured cycles align with how institutions manage reconciliation, approval, and release workflows."
    }
  ],
  scheduleNote: "Primary settlement window: Monday, 09:00 local time, as published in your dashboard and help resources."
} as const;

export const TRANSPARENCY_HIGHLIGHTS = {
  eyebrow: "Transparency",
  title: "What you can see in your account",
  description: "Alto Rich is designed so members can follow their journey without guessing.",
  items: [
    {
      title: "Transaction history",
      description: "Every wallet movement with references and timestamps.",
      href: "/wallet",
      cta: "Wallet"
    },
    {
      title: "Deposit tracking",
      description: "From transfer submission through verification to wallet credit.",
      href: "/deposits",
      cta: "Deposits"
    },
    {
      title: "Withdrawal tracking",
      description: "Status of withdrawal requests through published review windows.",
      href: "/withdrawals",
      cta: "Withdrawals"
    },
    {
      title: "Portfolio history",
      description: "Active allocations, earnings, and settlement records.",
      href: "/portfolio",
      cta: "Portfolio"
    },
    {
      title: "Activity timeline",
      description: "A chronological view of key account events.",
      href: "/activities",
      cta: "Activity"
    },
    {
      title: "Leadership",
      description: "Meet the team and governance standards behind Alto Rich.",
      href: "/company/leadership",
      cta: "Leadership"
    },
    {
      title: "Knowledge Centre",
      description: "Guides on platform mechanics, security, and informed investing.",
      href: "/learn",
      cta: "Knowledge Centre"
    },
    {
      title: "Security Centre",
      description: "How we protect accounts, devices, and sensitive actions.",
      href: "/company/security",
      cta: "Security Centre"
    },
    {
      title: "Transparency Centre",
      description: "Operational visibility, policies, and published metrics.",
      href: "/company/transparency",
      cta: "Transparency Center"
    }
  ]
} as const;

export const HOW_IT_WORKS_FAQ = [
  {
    q: "How do I start?",
    a: `Register at ${COMPANY.brand}, verify your email, choose a portfolio, fund your wallet via bank transfer, and allocate once your deposit is verified. The full journey is illustrated above.`
  },
  {
    q: "How do deposits work?",
    a: "Transfer the exact amount to the active receiving account in your dashboard, then submit your transfer reference. Funds appear in your wallet only after administrator reconciliation against a verified bank credit."
  },
  {
    q: "How are withdrawals processed?",
    a: "Submit a withdrawal request during published review windows (typically Monday and Thursday from 8:00 AM). Requests are verified before funds are released to your registered bank account."
  },
  {
    q: "How do I monitor my investment?",
    a: "Use your dashboard, portfolio page, wallet, and activity timeline. Every allocation, settlement, and balance change is recorded with references you can review at any time."
  },
  {
    q: "How do I contact support?",
    a: `Email ${COMPANY.supportEmail} or use the contact form. Include your registered email and any relevant transaction reference for faster assistance.`
  }
] as const;
