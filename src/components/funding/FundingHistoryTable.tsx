import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import type { Deposit } from "@/types/database";

type Props = {
  rows: Deposit[];
};

function statusVariant(status: string): "emerald" | "gold" | "outline" {
  if (status === "completed" || status === "approved") return "emerald";
  if (status === "rejected") return "outline";
  return "gold";
}

export function FundingHistoryTable({ rows }: Props) {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="font-semibold text-[var(--heading)]">Funding history</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Recent transfers submitted for verification.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--gray-50)] text-left text-xs uppercase text-[var(--text-subtle)] dark:bg-[var(--surface)]">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[var(--text-subtle)]">
                  No funding requests yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-5 py-3 text-[var(--text-muted)]">
                    {new Date(row.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{row.reference}</td>
                  <td className="px-5 py-3 tabular-nums font-medium">{formatNaira(Number(row.amount))}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
