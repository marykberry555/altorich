"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import type { WithdrawalTrackerView } from "@/lib/financial-events/withdrawal-tracker";
import { OperationalStepTracker } from "./OperationalStepTracker";
import { StatusChip, payoutStatusToChipVariant } from "./StatusChip";

type Props = {
  tracker: WithdrawalTrackerView;
  defaultExpanded?: boolean;
};

export function WithdrawalTrackerCard({ tracker, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card variant="elevated" padding="md" className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Withdrawal Request</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[var(--heading)]">{tracker.reference}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(tracker.amount)}</p>
        </div>
        <ChevronDown
          size={18}
          className={cn("mt-1 shrink-0 text-[var(--text-subtle)] transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      <div className="my-4 h-px bg-[var(--border)]" aria-hidden />

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-[var(--text-subtle)]">Status</dt>
          <dd className="mt-1">
            <StatusChip label={tracker.statusLabel} variant={payoutStatusToChipVariant(tracker.statusLabel)} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-subtle)]">Queue Position</dt>
          <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">
            {tracker.queuePosition != null ? `#${tracker.queuePosition}` : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-[var(--text-subtle)]">Estimated Processing</dt>
          <dd className="mt-1 text-sm text-[var(--heading)]">
            {tracker.estimatedProcessingLabel ?? tracker.schedulingMessage}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--text-subtle)]">Requested</dt>
          <dd className="mt-1 text-sm text-[var(--heading)]">{tracker.requestedAt}</dd>
        </div>
        {tracker.paidAt ? (
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Paid</dt>
            <dd className="mt-1 text-sm text-[var(--heading)]">{tracker.paidAt}</dd>
          </div>
        ) : null}
      </dl>

      {expanded ? (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Timeline</p>
          <OperationalStepTracker steps={tracker.steps} />
          <dl className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--text-subtle)]">Fund source</dt>
              <dd className="mt-1 font-medium text-[var(--heading)]">{tracker.fundSourceLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-subtle)]">Bank destination</dt>
              <dd className="mt-1 font-medium text-[var(--heading)]">{tracker.bankDestination}</dd>
            </div>
            {tracker.processingDuration ? (
              <div>
                <dt className="text-xs text-[var(--text-subtle)]">Processing duration</dt>
                <dd className="mt-1 font-medium text-[var(--heading)]">{tracker.processingDuration}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}
