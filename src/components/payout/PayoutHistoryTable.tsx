import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import { payoutStatusLabel, payoutStatusVariant } from "@/lib/payout/status";
import type { Withdrawal } from "@/types/database";

type Props = {
  rows: Withdrawal[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function EmptyPayout() {
  return (
    <div className="flex flex-col items-center px-5 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gray-100)] text-[var(--text-subtle)]">
        <ArrowUpRight size={28} strokeWidth={1.5} aria-hidden />
      </span>
      <p className="mt-4 font-semibold text-[var(--heading)]">No withdrawals yet</p>
      <p className="mt-1.5 max-w-xs text-sm text-[var(--text-muted)]">
        Your withdrawal history will appear here after you request a withdrawal.
      </p>
    </div>
  );
}

export function PayoutHistoryTable({ rows }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Withdrawal history</h2>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyPayout />
        ) : (
          <>
            <ul className="divide-y divide-[var(--border)] md:hidden">
              {rows.map((row) => {
                const label = payoutStatusLabel(row);
                return (
                  <li key={row.id} className="flex items-start justify-between gap-3 px-4 py-4">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm text-[var(--text-muted)]">{formatDate(row.created_at)}</p>
                      <p className="font-mono text-xs text-[var(--heading)]">
                        {row.settlement_reference ?? row.id.slice(0, 8).toUpperCase()}
                      </p>
                      <Badge variant={payoutStatusVariant(label)}>{label}</Badge>
                    </div>
                    <p className="shrink-0 text-base font-semibold tabular-nums text-[var(--heading)]">
                      {formatNaira(Number(row.amount))}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--gray-50)] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)] dark:bg-[var(--surface)]">
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const label = payoutStatusLabel(row);
                    return (
                      <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-5 py-4 text-[var(--text-muted)]">{formatDate(row.created_at)}</td>
                        <td className="max-w-[180px] truncate px-5 py-4 font-mono text-xs text-[var(--heading)]">
                          {row.settlement_reference ?? row.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-4 tabular-nums font-semibold text-[var(--heading)]">
                          {formatNaira(Number(row.amount))}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={payoutStatusVariant(label)}>{label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
