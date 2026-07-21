"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import type { DepositTrackerView } from "@/lib/financial-events/deposit-tracker";
import { OperationalStepTracker } from "./OperationalStepTracker";
import { StatusChip } from "./StatusChip";

type Props = {
  tracker: DepositTrackerView;
  defaultExpanded?: boolean;
};

export function DepositTrackerCard({ tracker, defaultExpanded = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card variant="elevated" padding="md">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Deposit in progress</p>
          <p className="mt-1 font-mono text-sm font-semibold text-[var(--heading)]">{tracker.reference}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(tracker.amount)}</p>
        </div>
        <ChevronDown
          size={18}
          className={cn("mt-1 shrink-0 text-[var(--text-subtle)] transition-transform", expanded && "rotate-180")}
          aria-hidden
        />
      </button>

      <div className="mt-4 flex items-center gap-2">
        <StatusChip
          label={tracker.statusLabel}
          variant={tracker.statusLabel === "Rejected" ? "slate" : tracker.statusLabel === "Completed" ? "emerald" : "gold"}
        />
      </div>

      {expanded ? (
        <div className="mt-6">
          <OperationalStepTracker steps={tracker.steps} label="Deposit progress" />
          <dl className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4 text-sm sm:grid-cols-2">
            {tracker.reviewedAt ? (
              <div>
                <dt className="text-xs text-[var(--text-subtle)]">Approval time</dt>
                <dd className="mt-1 font-medium text-[var(--heading)]">{tracker.reviewedAt}</dd>
              </div>
            ) : null}
            {tracker.creditedAt ? (
              <div>
                <dt className="text-xs text-[var(--text-subtle)]">Credited time</dt>
                <dd className="mt-1 font-medium text-[var(--heading)]">{tracker.creditedAt}</dd>
              </div>
            ) : null}
            {tracker.investmentNote ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[var(--text-subtle)]">Investment allocation</dt>
                <dd className="mt-1 font-medium text-[var(--heading)]">{tracker.investmentNote}</dd>
              </div>
            ) : null}
            {tracker.proofUrl ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-[var(--text-subtle)]">Receipt</dt>
                <dd className="mt-1">
                  <Link
                    href={tracker.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--emerald)] hover:underline"
                  >
                    View receipt
                    <ExternalLink size={14} aria-hidden />
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}
