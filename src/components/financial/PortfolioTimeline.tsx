import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { FinancialTimelineEvent } from "@/lib/financial-events/types";
import { FinancialTimeline } from "./FinancialTimeline";

type Props = {
  events: FinancialTimelineEvent[];
  title?: string;
};

export function PortfolioTimeline({ events, title = "Investment lifecycle" }: Props) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No investment activity yet"
        description="Fund your account and activate an investment to see your capital lifecycle here."
        action={
          <Link href="/investments">
            <Button size="sm">Browse packages</Button>
          </Link>
        }
      />
    );
  }

  return (
    <FinancialTimeline
      events={events}
      title={title}
      emptyTitle="No investment activity yet"
      emptyDescription="Your deposit-to-withdrawal journey will appear here."
    />
  );
}
