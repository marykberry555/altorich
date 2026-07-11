import type { Withdrawal } from "@/types/database";

export type PayoutStatusLabel =
  | "Scheduled"
  | "Pending"
  | "Processing"
  | "Approved"
  | "Paid"
  | "Rejected"
  | "Cancelled";

export function payoutStatusLabel(row: Pick<Withdrawal, "status" | "scheduled_at">): PayoutStatusLabel {
  if (row.status === "scheduled") return "Scheduled";
  if (row.status === "pending") {
    if (row.scheduled_at && new Date(row.scheduled_at) > new Date()) return "Scheduled";
    return "Pending";
  }
  if (row.status === "approved") return "Processing";
  if (row.status === "paid") return "Paid";
  if (row.status === "rejected") return "Rejected";
  if (row.status === "cancelled") return "Cancelled";
  return "Pending";
}

export function payoutStatusVariant(
  label: PayoutStatusLabel
): "emerald" | "gold" | "outline" | "navy" {
  if (label === "Paid") return "emerald";
  if (label === "Rejected" || label === "Cancelled") return "outline";
  if (label === "Processing" || label === "Approved") return "navy";
  return "gold";
}
