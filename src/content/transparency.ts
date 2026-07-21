import { COMPANY } from "@/lib/company";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";

export const TRANSPARENCY_PAGE = {
  path: "/company/transparency",
  hero: {
    eyebrow: "Transparency Center",
    title: "Transparency You Can Verify",
    description:
      "At Alto Rich we believe trust is earned through visibility, accountability, and consistent execution. This centre shows how we operate — with real metrics where available, and clear explanations everywhere else."
  }
} as const;

export const STATUS_PAGE = {
  path: "/status",
  title: "System Status",
  description: "Current operational status for Alto Rich platform services."
} as const;

export const MEMBER_PROTECTION_PILLARS = [
  {
    title: "Deposit verification",
    description: "Every transfer is matched to a real bank credit before your wallet balance updates.",
    icon: "shield"
  },
  {
    title: "Withdrawal processing",
    description: "Withdrawals follow published settlement windows and are tracked through to completion.",
    icon: "clock"
  },
  {
    title: "Settlement windows",
    description: PLATFORM_EARNING.payoutTiming + " — predictable, documented, and visible in your dashboard.",
    icon: "calendar"
  },
  {
    title: "Member verification",
    description: "Identity and bank details are checked before wallets and investments go live.",
    icon: "user-check"
  },
  {
    title: "Reconciliation",
    description: "Deposits are reconciled against real bank credits — not assumed or estimated.",
    icon: "scale"
  },
  {
    title: "Audit trails",
    description: "Operational actions are logged to support accountability and internal review.",
    icon: "file"
  }
] as const;

export const WITHDRAWAL_FLOW = [
  { title: "Withdrawal requested", description: "You submit a withdrawal from your wallet during the published window." },
  { title: "Queue position", description: "Your request enters the settlement queue in the order received." },
  { title: "Processing", description: "Operations review the request against your verified account details." },
  { title: "Approved", description: "Approved withdrawals are prepared for bank transfer." },
  { title: "Bank transfer", description: "Funds are sent to your registered bank account." },
  { title: "Completed", description: "You receive confirmation when the transfer is complete." }
] as const;

export const DEPOSIT_FLOW = [
  { title: "Bank transfer", description: "You transfer naira to a published Alto Rich receiving account." },
  { title: "Receipt verification", description: "Submit your transfer reference and proof for matching." },
  { title: "Approval", description: "Operations verify the credit against real bank records." },
  { title: "Wallet credit", description: "Your wallet balance updates after verification." },
  { title: "Investment allocation", description: "Allocate funds to your chosen investment portfolio." },
  { title: "Ledger entry", description: "Every credit is recorded in your transaction history." }
] as const;

export const REPORT_CATEGORIES = [
  { id: "monthly", title: "Monthly Reports", description: "Periodic operational summaries.", available: false },
  { id: "operational", title: "Operational Reports", description: "Platform activity and processing reports.", available: false },
  { id: "transparency", title: "Transparency Reports", description: "Published transparency disclosures.", available: false },
  { id: "announcements", title: "Announcements", description: "Official platform announcements.", available: false },
  { id: "audit", title: "Future Audit Reports", description: "Independent audit reports when published.", available: false },
  { id: "financial", title: "Future Financial Reports", description: "Financial disclosures when approved for publication.", available: false },
  { id: "compliance", title: "Future Compliance Reports", description: "Regulatory and compliance disclosures.", available: false }
] as const;

export const POLICY_LINKS = [
  { label: "Terms of Service", href: "/legal/terms", description: "Platform terms and member responsibilities." },
  { label: "Privacy Policy", href: "/legal/privacy", description: "How we handle and protect your data." },
  { label: "AML Policy", href: "/legal/aml", description: "Anti-money laundering standards." },
  { label: "KYC Policy", href: "/legal/kyc", description: "Identity verification requirements." },
  { label: "Risk Disclosure", href: "/legal/risk", description: "Investment and platform risk information." },
  { label: "Complaints Procedure", href: "/legal/complaints", description: "How to raise and resolve complaints." },
  { label: "Cookie Policy", href: "/legal/cookies", description: "Cookie usage and preferences." },
  { label: "Security Overview", href: "/legal/security", description: "Platform security practices." }
] as const;

export const SECURITY_TOPICS = [
  { title: "Account security", description: "PIN-based authentication and session protections for member accounts." },
  { title: "Email verification", description: "Email confirmation required before wallets and investments activate." },
  { title: "Secure authentication", description: "OTP verification for new devices and sensitive account changes." },
  { title: "Activity monitoring", description: "Login activity is recorded to help detect unusual access patterns." },
  { title: "Withdrawal verification", description: "Withdrawals are sent only to verified bank accounts on your profile." },
  { title: "Session management", description: "Sessions expire and can be managed from your account settings." },
  { title: "Data protection", description: `${COMPANY.legalName} applies data protection standards to member information.` }
] as const;

export const TRANSPARENCY_COMMITMENTS = [
  { title: "Transparency before promises", description: "We publish how the platform works before asking for your trust." },
  { title: "Accountability before marketing", description: "Operational metrics take priority over promotional language." },
  { title: "Visibility before assumptions", description: "Members should see what happens to their funds — not guess." },
  { title: "Operational discipline", description: "Published rules, predictable schedules, and consistent processes." },
  { title: "Member-first communication", description: "Clear language about deposits, settlements, and withdrawals." },
  { title: "Long-term thinking", description: "Trust is built over years through reliable execution." },
  { title: "Professional stewardship", description: "Responsible handling of member funds and platform operations." }
] as const;
