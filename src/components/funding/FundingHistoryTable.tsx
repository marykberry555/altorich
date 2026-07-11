import { ArrowDownLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import type { Deposit } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  rows: Deposit[];
};

function statusLabel(status: string) {
  if (status === "completed" || status === "approved") return "Completed";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function statusClass(status: string) {
  if (status === "completed" || status === "approved") return "text-[var(--emerald)]";
  if (status === "rejected") return "text-[var(--text-subtle)]";
  return "text-amber-600";
}

export function FundingHistoryTable({ rows }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Funding history</h2>
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
                        <ArrowDownLeft size={28} strokeWidth={1.5} aria-hidden />
                      </span>
                      <p className="mt-4 font-semibold text-[var(--heading)]">No funding requests yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-4 text-[var(--text-muted)]">
                      {new Date(row.created_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-4 font-mono text-xs text-[var(--heading)]">{row.reference}</td>
                    <td className="px-5 py-4 tabular-nums font-semibold text-[var(--heading)]">
                      {formatNaira(Number(row.amount))}
                    </td>
                    <td className={cn("px-5 py-4 font-medium capitalize", statusClass(row.status))}>
                      {statusLabel(row.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
