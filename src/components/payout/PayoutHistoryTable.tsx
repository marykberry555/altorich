"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatNaira } from "@/lib/domain";
import { formatPayoutDestination } from "@/lib/payments";
import type { Withdrawal } from "@/types/database";

type Props = {
  rows: Withdrawal[];
};

const STATUS_OPTIONS = ["all", "pending", "approved", "paid", "rejected", "cancelled"] as const;

function statusVariant(status: string): "emerald" | "gold" | "outline" {
  if (status === "paid") return "emerald";
  if (status === "rejected" || status === "cancelled") return "outline";
  return "gold";
}

function displayStatus(status: string) {
  if (status === "approved") return "Processing";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function PayoutHistoryTable({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const haystack = `${row.id} ${row.bank_name} ${row.account_number} ${row.status}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Reference, method, or status"
          />
        </div>
        <label className="grid gap-1.5 sm:w-44">
          <span className="text-xs font-medium text-[var(--text-muted)]">Status</span>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : displayStatus(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--gray-50)] text-left text-xs uppercase text-[var(--text-subtle)] dark:bg-[var(--surface)]">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--text-subtle)]">
                  <Search size={20} className="mx-auto mb-2 opacity-40" aria-hidden />
                  No payout requests match your filters
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{row.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {new Date(row.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">{formatNaira(Number(row.amount))}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatPayoutDestination(row)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(row.status)}>{displayStatus(row.status)}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
