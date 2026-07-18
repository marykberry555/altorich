import type { Withdrawal } from "@/types/database";
import { memberQueueStatusLabel, type MemberQueueStatus } from "@/lib/payout/settlement-queue";

export type PayoutStatusLabel = MemberQueueStatus | "Pending" | "Approved";

export function payoutStatusLabel(
  row: Pick<Withdrawal, "status" | "scheduled_at"> & {
    processing_started_at?: string | null;
  }
): PayoutStatusLabel {
  return memberQueueStatusLabel(row);
}

export function payoutStatusVariant(
  label: PayoutStatusLabel
): "emerald" | "gold" | "outline" | "navy" {
  if (label === "Paid") return "emerald";
  if (label === "Rejected" || label === "Cancelled") return "outline";
  if (label === "Processing" || label === "Under Review" || label === "Approved") return "navy";
  return "gold";
}
