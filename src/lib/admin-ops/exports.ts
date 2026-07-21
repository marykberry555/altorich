import type { ExportDefinition } from "./types";

export const EXPORT_CATALOG: ExportDefinition[] = [
  {
    id: "members",
    label: "Members",
    description: "Member profiles, status, and registration dates.",
    formats: ["csv"],
    available: true,
    href: "/api/admin/export?type=members"
  },
  {
    id: "deposits",
    label: "Deposits",
    description: "Funding requests and approval history.",
    formats: ["csv"],
    available: true,
    href: "/api/admin/export?type=deposits"
  },
  {
    id: "withdrawals",
    label: "Withdrawals",
    description: "Withdrawal requests and settlement status.",
    formats: ["csv"],
    available: true,
    href: "/api/admin/export?type=withdrawals"
  },
  {
    id: "referrals",
    label: "Referrals",
    description: "Referral links and commission activity.",
    formats: ["csv"],
    available: false,
    href: null
  },
  {
    id: "welcome_bonus",
    label: "Welcome Bonus",
    description: "Programme participants and lifecycle status.",
    formats: ["csv"],
    available: false,
    href: null
  },
  {
    id: "support",
    label: "Support",
    description: "Support ticket history when integrated.",
    formats: ["csv"],
    available: false,
    href: null
  },
  {
    id: "audit",
    label: "Audit Logs",
    description: "Administrative action history.",
    formats: ["csv"],
    available: false,
    href: null
  },
  {
    id: "reports",
    label: "Reports",
    description: "Settlement and financial summary reports.",
    formats: ["csv", "pdf"],
    available: false,
    href: null
  }
];
