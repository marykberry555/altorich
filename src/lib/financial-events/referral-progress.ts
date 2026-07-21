import type { ReferralActivityRow } from "@/lib/referral/types";
import type { ReferralProgressView } from "./types";

function isVerifiedStatus(status: string) {
  return ["verified", "qualified", "paid"].includes(status);
}

export function buildReferralProgress(
  row: ReferralActivityRow,
  options?: { emailVerified?: boolean }
): ReferralProgressView {
  const verified = isVerifiedStatus(row.status);
  const hasDeposit = verified || (row.investmentAmount != null && row.investmentAmount > 0);
  const emailVerified = options?.emailVerified ?? verified;

  const steps = [
    { id: "registered", label: "Registered", status: "complete" as const },
    {
      id: "verified",
      label: "Email Verified",
      status: emailVerified ? ("complete" as const) : ("current" as const)
    },
    {
      id: "deposit",
      label: "First Deposit",
      status: hasDeposit ? ("complete" as const) : emailVerified ? ("current" as const) : ("pending" as const)
    }
  ];

  let outcomeLabel = "Referral Pending";
  let outcomeTone: ReferralProgressView["outcomeTone"] = "gold";
  if (verified && row.commissionAmount > 0) {
    outcomeLabel = "Commission Earned";
    outcomeTone = "emerald";
  } else if (verified) {
    outcomeLabel = "Verified Investor";
    outcomeTone = "emerald";
  } else if (emailVerified) {
    outcomeLabel = "Awaiting First Deposit";
    outcomeTone = "gold";
  }

  return {
    id: row.id,
    name: row.referredName,
    username: row.username,
    avatarUrl: row.avatarUrl,
    joinedAt: row.createdAt,
    steps,
    outcomeLabel,
    outcomeTone,
    commissionAmount: row.commissionAmount > 0 ? row.commissionAmount : undefined
  };
}
