"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/domain";
import type { Withdrawal } from "@/types/database";
import { buildWithdrawalTrackerView } from "@/lib/financial-events/withdrawal-tracker";
import { formatFinancialDate, formatFinancialDateTime } from "@/lib/financial-events/format";
import { StatusChip, payoutStatusToChipVariant } from "./StatusChip";
import { OperationalStepTracker } from "./OperationalStepTracker";

type Props = {
  rows: Withdrawal[];
};

export function WithdrawalHistoryList({ rows }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Withdrawal history</h2>
        <Card variant="elevated" padding="none">
          <EmptyState
            icon={ArrowUpRight}
            title="No withdrawals yet"
            description="Your withdrawal history will appear here after you request a withdrawal."
            action={
              <Link href="/withdrawals#request">
                <Button size="sm">Request withdrawal</Button>
              </Link>
            }
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Withdrawal history</h2>
      <ul className="space-y-3">
        {rows.map((row) => {
          const view = buildWithdrawalTrackerView(row);
          const open = expandedId === row.id;
          return (
            <li key={row.id}>
              <Card variant="elevated" padding="md" className="overflow-hidden transition-shadow hover:shadow-[var(--shadow-md)]">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 text-left"
                  onClick={() => setExpandedId(open ? null : row.id)}
                  aria-expanded={open}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs text-[var(--heading)]">{view.reference}</p>
                      <StatusChip label={view.statusLabel} variant={payoutStatusToChipVariant(view.statusLabel)} />
                    </div>
                    <p className="text-xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(view.amount)}</p>
                    <p className="text-xs text-[var(--text-muted)]">Requested {formatFinancialDate(row.created_at)}</p>
                  </div>
                  <span className={cn("text-xs font-semibold text-[var(--emerald)]", open && "underline")}>
                    {open ? "Hide" : "Details"}
                  </span>
                </button>

                {open ? (
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <OperationalStepTracker steps={view.steps} />
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-[var(--text-subtle)]">Fund source</dt>
                        <dd className="mt-0.5 font-medium">{view.fundSourceLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[var(--text-subtle)]">Bank destination</dt>
                        <dd className="mt-0.5 font-medium">{view.bankDestination}</dd>
                      </div>
                      {view.approvedAt ? (
                        <div>
                          <dt className="text-xs text-[var(--text-subtle)]">Approved</dt>
                          <dd className="mt-0.5 font-medium">{view.approvedAt}</dd>
                        </div>
                      ) : null}
                      {view.paidAt ? (
                        <div>
                          <dt className="text-xs text-[var(--text-subtle)]">Paid</dt>
                          <dd className="mt-0.5 font-medium">{view.paidAt}</dd>
                        </div>
                      ) : null}
                      {view.processingDuration ? (
                        <div>
                          <dt className="text-xs text-[var(--text-subtle)]">Processing duration</dt>
                          <dd className="mt-0.5 font-medium">{view.processingDuration}</dd>
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-[var(--text-subtle)]">Requested at</dt>
                        <dd className="mt-0.5 font-medium">{formatFinancialDateTime(row.created_at)}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
