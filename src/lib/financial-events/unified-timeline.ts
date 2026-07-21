import type { Deposit, Withdrawal } from "@/types/database";
import type { FinancialTimelineEvent } from "./types";

type WalletTx = {
  id: string;
  type: string;
  reason: string;
  created_at: string;
  amount: number;
  reference?: string;
};

type ProfileMeta = {
  created_at?: string | null;
  email_verified_at?: string | null;
};

export function buildUnifiedTimeline(input: {
  profile?: ProfileMeta | null;
  deposits?: Deposit[];
  withdrawals?: Withdrawal[];
  transactions?: WalletTx[];
  limit?: number;
}): FinancialTimelineEvent[] {
  const events: FinancialTimelineEvent[] = [];
  const limit = input.limit ?? 30;

  if (input.profile?.created_at) {
    events.push({
      id: "account-created",
      kind: "account",
      title: "Account Created",
      description: "Welcome to Alto Rich.",
      timestamp: input.profile.created_at,
      status: "Complete"
    });
  }

  if (input.profile?.email_verified_at) {
    events.push({
      id: "email-verified",
      kind: "account",
      title: "Email Verified",
      description: "Your email address was confirmed.",
      timestamp: input.profile.email_verified_at,
      status: "Complete"
    });
  }

  for (const d of input.deposits ?? []) {
    events.push({
      id: `deposit-${d.id}`,
      kind: "deposit",
      title: d.status === "approved" || d.status === "completed" ? "Deposit Approved" : "Deposit Submitted",
      description:
        d.status === "pending"
          ? "Your transfer is awaiting review."
          : d.status === "rejected"
            ? d.rejection_reason ?? "Deposit was not approved."
            : "Funds credited to your wallet.",
      reference: d.reference,
      timestamp: d.reviewed_at ?? d.created_at,
      amount: Number(d.amount),
      status: d.status,
      href: "/deposits"
    });

    if (d.workflow_phase === "investment_created" || d.workflow_phase === "completed") {
      events.push({
        id: `investment-${d.id}`,
        kind: "investment",
        title: "Investment Activated",
        description: "Your deposit was allocated to your investment portfolio.",
        reference: d.reference,
        timestamp: d.workflow_updated_at ?? d.reviewed_at ?? d.created_at,
        amount: Number(d.amount),
        href: "/portfolio"
      });
    }
  }

  for (const w of input.withdrawals ?? []) {
    const paid = w.status === "paid";
    events.push({
      id: `withdrawal-${w.id}`,
      kind: "withdrawal",
      title: paid ? "Withdrawal Paid" : w.processing_started_at ? "Withdrawal Processing" : "Withdrawal Requested",
      description: paid
        ? "Funds sent to your bank account."
        : w.queue_number
          ? `Queue position #${w.queue_number}.`
          : "Your request is in the settlement queue.",
      reference: w.settlement_reference,
      timestamp: w.paid_at ?? w.processing_started_at ?? w.queued_at ?? w.created_at,
      amount: Number(w.amount),
      status: w.status,
      href: "/withdrawals"
    });
  }

  for (const t of input.transactions ?? []) {
    const reason = t.reason.toLowerCase();
    let kind: FinancialTimelineEvent["kind"] = "other";
    let title = t.reason.replace(/_/g, " ");

    if (reason.includes("settlement") || reason.includes("earning")) {
      kind = "settlement";
      title = "Daily Earnings Accrued";
    } else if (reason.includes("referral")) {
      kind = "referral";
      title = "Referral Earned";
    } else if (reason.includes("welcome bonus") || reason.includes("bonus")) {
      kind = "bonus";
      title = reason.includes("unlock") ? "Bonus Unlocked" : reason.includes("qualif") ? "Bonus Qualified" : "Bonus Reserved";
    } else if (reason.includes("deposit")) {
      continue;
    } else if (reason.includes("withdraw")) {
      continue;
    }

    events.push({
      id: `tx-${t.id}`,
      kind,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: t.type === "credit" ? "Credit to your wallet." : "Debit from your wallet.",
      reference: t.reference,
      timestamp: t.created_at,
      amount: Number(t.amount),
      href: "/wallet"
    });
  }

  return events
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
