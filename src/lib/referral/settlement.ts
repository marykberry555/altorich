import {
  formatNextPayoutDate,
  isPayoutProcessingOpen,
  nextPayoutProcessingAt
} from "@/lib/payout/schedule";

export type ReferralPayoutEligibilityStatus =
  | "eligible"
  | "below_minimum"
  | "awaiting_settlement"
  | "program_disabled";

export type ReferralPayoutEligibility = {
  programEnabled: boolean;
  meetsThreshold: boolean;
  settlementWindowOpen: boolean;
  canRequestPayout: boolean;
  payoutGap: number;
  minPayoutThreshold: number;
  availableBalance: number;
  nextSettlementAt: Date;
  nextSettlementLabel: string;
  eligibilityStatus: ReferralPayoutEligibilityStatus;
  eligibilityMessage: string;
};

/** Monday 9:00 AM through end of Monday — same ops window as platform settlement. */
export function isReferralSettlementWindowOpen(now = new Date()) {
  return isPayoutProcessingOpen(now);
}

export function nextReferralSettlementAt(now = new Date()) {
  return nextPayoutProcessingAt(now);
}

export function formatReferralSettlementLabel(at: Date) {
  const date = formatNextPayoutDate(at);
  return `Monday, 9:00 AM · ${date}`;
}

/** Settlement batch key for admin grouping (WAT Monday date of the open window). */
export function referralSettlementBatchId(now = new Date()) {
  if (isReferralSettlementWindowOpen(now)) {
    return formatNextPayoutDate(now);
  }
  return formatNextPayoutDate(nextReferralSettlementAt(now));
}

/**
 * Batch label for a payout created_at — the Monday settlement week that request belonged to.
 * Requests submitted during Monday window use that Monday's date; otherwise the upcoming Monday.
 */
export function referralSettlementBatchForCreatedAt(createdAt: string | Date) {
  const at = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  if (isReferralSettlementWindowOpen(at)) {
    return formatNextPayoutDate(at);
  }
  // Before Monday 09:00 or mid-week: attribute to the next Monday settlement they were waiting for.
  // If submitted after Monday window (Tue–Sun), next Monday is correct.
  // If submitted Monday before 09:00, nextMondayAt9amLagos returns today 09:00 — format that date.
  return formatNextPayoutDate(nextReferralSettlementAt(at));
}

export function evaluateReferralPayoutEligibility(input: {
  availableBalance: number;
  minPayoutThreshold: number;
  programEnabled: boolean;
  now?: Date;
}): ReferralPayoutEligibility {
  const now = input.now ?? new Date();
  const availableBalance = Math.max(0, input.availableBalance);
  const minPayoutThreshold = Math.max(0, input.minPayoutThreshold);
  const payoutGap = Math.max(0, minPayoutThreshold - availableBalance);
  const meetsThreshold = availableBalance >= minPayoutThreshold;
  const settlementWindowOpen = isReferralSettlementWindowOpen(now);
  const nextSettlementAt = nextReferralSettlementAt(now);
  const nextSettlementLabel = formatReferralSettlementLabel(nextSettlementAt);

  if (!input.programEnabled) {
    return {
      programEnabled: false,
      meetsThreshold,
      settlementWindowOpen,
      canRequestPayout: false,
      payoutGap,
      minPayoutThreshold,
      availableBalance,
      nextSettlementAt,
      nextSettlementLabel,
      eligibilityStatus: "program_disabled",
      eligibilityMessage: "Referral programme is currently unavailable."
    };
  }

  if (!meetsThreshold) {
    return {
      programEnabled: true,
      meetsThreshold: false,
      settlementWindowOpen,
      canRequestPayout: false,
      payoutGap,
      minPayoutThreshold,
      availableBalance,
      nextSettlementAt,
      nextSettlementLabel,
      eligibilityStatus: "below_minimum",
      eligibilityMessage: `You need ₦${payoutGap.toLocaleString("en-NG")} more in referral rewards to qualify for Monday settlement.`
    };
  }

  if (!settlementWindowOpen) {
    return {
      programEnabled: true,
      meetsThreshold: true,
      settlementWindowOpen: false,
      canRequestPayout: false,
      payoutGap: 0,
      minPayoutThreshold,
      availableBalance,
      nextSettlementAt,
      nextSettlementLabel,
      eligibilityStatus: "awaiting_settlement",
      eligibilityMessage: "Unavailable until settlement opens"
    };
  }

  return {
    programEnabled: true,
    meetsThreshold: true,
    settlementWindowOpen: true,
    canRequestPayout: true,
    payoutGap: 0,
    minPayoutThreshold,
    availableBalance,
    nextSettlementAt,
    nextSettlementLabel,
    eligibilityStatus: "eligible",
    eligibilityMessage: "Settlement window open — you can request a withdrawal."
  };
}
