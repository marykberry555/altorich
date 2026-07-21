"use client";

import { ArrowDownLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNaira } from "@/lib/domain";
import type { Deposit } from "@/types/database";
import { buildDepositTrackerView } from "@/lib/financial-events/deposit-tracker";
import { formatFinancialDate, formatFinancialDateTime } from "@/lib/financial-events/format";
import { StatusChip } from "./StatusChip";
import { OperationalStepTracker } from "./OperationalStepTracker";

type Props = {
  rows: Deposit[];
};

export function DepositHistoryList({ rows }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Funding history</h2>
        <Card variant="elevated" padding="none">
          <EmptyState
            icon={ArrowDownLeft}
            title="No deposits yet"
            description="Submit your first bank transfer proof to fund your wallet and start investing."
            action={
              <Link href="/deposits">
                <Button size="sm">Fund wallet</Button>
              </Link>
            }
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Funding history</h2>
      <ul className="space-y-3">
        {rows.map((row) => {
          const view = buildDepositTrackerView(row);
          const open = expandedId === row.id;
          return (
            <li key={row.id}>
              <Card variant="elevated" padding="md" className="transition-shadow hover:shadow-[var(--shadow-md)]">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 text-left"
                  onClick={() => setExpandedId(open ? null : row.id)}
                  aria-expanded={open}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs text-[var(--heading)]">{view.reference}</p>
                      <StatusChip
                        label={view.statusLabel}
                        variant={
                          view.statusLabel === "Rejected" ? "slate" : view.statusLabel === "Completed" ? "emerald" : "gold"
                        }
                      />
                    </div>
                    <p className="text-xl font-bold tabular-nums text-[var(--heading)]">{formatNaira(view.amount)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatFinancialDate(row.created_at)}</p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--emerald)]">{open ? "Hide" : "Details"}</span>
                </button>

                {open ? (
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <OperationalStepTracker steps={view.steps} />
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      {view.reviewedAt ? (
                        <div>
                          <dt className="text-xs text-[var(--text-subtle)]">Approval time</dt>
                          <dd className="mt-0.5 font-medium">{view.reviewedAt}</dd>
                        </div>
                      ) : null}
                      {view.creditedAt ? (
                        <div>
                          <dt className="text-xs text-[var(--text-subtle)]">Credited time</dt>
                          <dd className="mt-0.5 font-medium">{view.creditedAt}</dd>
                        </div>
                      ) : null}
                      {view.investmentNote ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-[var(--text-subtle)]">Investment allocation</dt>
                          <dd className="mt-0.5 font-medium">{view.investmentNote}</dd>
                        </div>
                      ) : null}
                      {view.proofUrl ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-[var(--text-subtle)]">Receipt</dt>
                          <dd className="mt-0.5">
                            <Link
                              href={view.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-[var(--emerald)] hover:underline"
                            >
                              View receipt
                              <ExternalLink size={14} aria-hidden />
                            </Link>
                          </dd>
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-[var(--text-subtle)]">Submitted</dt>
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
