import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import { payoutStatusLabel, payoutStatusVariant } from "@/lib/payout/status";
import type { Withdrawal } from "@/types/database";

type Props = {
  rows: Withdrawal[];
};

export function PayoutHistoryTable({ rows }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Payout history</h2>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16">
                    <div className="flex flex-col items-center text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gray-100)] text-[var(--text-subtle)]">
                        <ArrowUpRight size={28} strokeWidth={1.5} aria-hidden />
                      </span>
                      <p className="mt-4 font-semibold text-[var(--heading)]">No withdrawals yet</p>
                      <p className="mt-1.5 max-w-xs text-sm text-[var(--text-muted)]">
                        Your withdrawal history will appear here after you request a payout.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const label = payoutStatusLabel(row);
                  return (
                    <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-5 py-4 text-[var(--text-muted)]">
                        {new Date(row.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>
                      <td className="max-w-[180px] truncate px-5 py-4 font-mono text-xs text-[var(--heading)]">
                        {row.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 tabular-nums font-semibold text-[var(--heading)]">
                        {formatNaira(Number(row.amount))}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={payoutStatusVariant(label)}>{label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
