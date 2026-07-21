import { FinancialTimeline } from "@/components/financial/FinancialTimeline";
import type { FinancialTimelineEvent } from "@/lib/financial-events/types";

export type ActivityItem = FinancialTimelineEvent & {
  kind: FinancialTimelineEvent["kind"];
  created_at?: string;
};

type Props = {
  items: ActivityItem[] | FinancialTimelineEvent[];
  className?: string;
};

export function mapTransactionToActivity(row: {
  id: string;
  type: string;
  reason: string;
  created_at: string;
  amount: number;
}): FinancialTimelineEvent {
  const reason = row.reason.toLowerCase();
  let kind: FinancialTimelineEvent["kind"] = "other";
  let title = row.reason;

  if (reason.includes("deposit") || (row.type === "credit" && reason.includes("fund"))) {
    kind = "deposit";
    title = reason.includes("approved") ? "Deposit approved" : "Deposit submitted";
  } else if (reason.includes("withdraw")) {
    kind = "withdrawal";
    title = reason.includes("paid") ? "Withdrawal paid" : "Withdrawal requested";
  } else if (reason.includes("invest") || reason.includes("allocation")) {
    kind = "investment";
    title = "Investment started";
  } else if (reason.includes("welcome bonus") || reason.includes("bonus")) {
    kind = "bonus";
    title = reason.includes("unlock") ? "Bonus unlocked" : "Bonus reserved";
  } else if (reason.includes("settlement") || reason.includes("earning")) {
    kind = "settlement";
    title = "Settlement completed";
  }

  return {
    id: row.id,
    title,
    description: `₦${Math.abs(row.amount).toLocaleString("en-NG")}`,
    timestamp: row.created_at,
    kind,
    amount: Math.abs(row.amount)
  };
}

/** @deprecated Use FinancialTimeline directly */
export function DashboardActivityTimeline({ items, className }: Props) {
  const events: FinancialTimelineEvent[] = items.map((item) =>
    "timestamp" in item && item.timestamp
      ? (item as FinancialTimelineEvent)
      : {
          ...(item as ActivityItem),
          timestamp: (item as ActivityItem).created_at ?? (item as FinancialTimelineEvent).timestamp
        }
  );

  return (
    <FinancialTimeline
      events={events}
      title="Recent activity"
      className={className}
    />
  );
}
