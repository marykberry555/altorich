import type { MemberStatusItem } from "./types";
import type { WelcomeBonusLifecycle } from "@/lib/welcome-bonus/lifecycle";

export function buildMemberStatusSummary(input: {
  memberSince?: string | null;
  emailVerified?: boolean;
  kycStatus?: string | null;
  hasActiveInvestment?: boolean;
  portfolioValue?: number;
  pendingWithdrawals?: number;
  pendingDeposits?: number;
  welcomeBonusLifecycle?: WelcomeBonusLifecycle | null;
  referralCount?: number;
  referralVerified?: number;
}): MemberStatusItem[] {
  const items: MemberStatusItem[] = [];

  if (input.memberSince) {
    items.push({
      id: "member-since",
      label: "Member Since",
      value: new Date(input.memberSince).toLocaleDateString("en-NG", { month: "long", year: "numeric" }),
      tone: "navy"
    });
  }

  items.push({
    id: "verification",
    label: "Verification Status",
    value: input.emailVerified ? "Email verified" : "Email pending",
    tone: input.emailVerified ? "emerald" : "gold",
    href: "/settings"
  });

  if (input.kycStatus) {
    items.push({
      id: "kyc",
      label: "KYC Status",
      value: input.kycStatus.replace(/_/g, " "),
      tone: input.kycStatus === "approved" ? "emerald" : "gold"
    });
  }

  items.push({
    id: "investment",
    label: "Investment Status",
    value: input.hasActiveInvestment ? "Active" : "Not invested",
    tone: input.hasActiveInvestment ? "emerald" : "slate",
    href: "/investments"
  });

  items.push({
    id: "portfolio",
    label: "Portfolio Status",
    value:
      (input.portfolioValue ?? 0) > 0
        ? `₦${Math.round(input.portfolioValue ?? 0).toLocaleString("en-NG")} value`
        : "No active capital",
    tone: (input.portfolioValue ?? 0) > 0 ? "emerald" : "slate",
    href: "/portfolio"
  });

  items.push({
    id: "withdrawal-eligibility",
    label: "Withdrawal Eligibility",
    value:
      (input.pendingWithdrawals ?? 0) > 0
        ? `${input.pendingWithdrawals} pending`
        : (input.portfolioValue ?? 0) > 0
          ? "Eligible"
          : "Fund account first",
    tone: (input.pendingWithdrawals ?? 0) > 0 ? "gold" : "navy",
    href: "/withdrawals"
  });

  if (input.welcomeBonusLifecycle) {
    items.push({
      id: "bonus",
      label: "Bonus Status",
      value: input.welcomeBonusLifecycle.title,
      tone: input.welcomeBonusLifecycle.tone === "slate" ? "slate" : input.welcomeBonusLifecycle.tone,
      href: "/wallet"
    });
  }

  items.push({
    id: "referral",
    label: "Referral Status",
    value:
      (input.referralCount ?? 0) === 0
        ? "No referrals yet"
        : `${input.referralVerified ?? 0} verified of ${input.referralCount}`,
    tone: (input.referralVerified ?? 0) > 0 ? "emerald" : "gold",
    href: "/team"
  });

  if ((input.pendingDeposits ?? 0) > 0) {
    items.push({
      id: "deposits-pending",
      label: "Pending Deposits",
      value: String(input.pendingDeposits),
      tone: "gold",
      href: "/deposits"
    });
  }

  return items;
}
