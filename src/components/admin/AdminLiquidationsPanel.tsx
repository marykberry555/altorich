"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, MessageSquare, X } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import type { CapitalLiquidationRequest } from "@/services/investment/capital-liquidation.service";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/design-system";

type Props = {
  pending: CapitalLiquidationRequest[];
};

export function AdminLiquidationsPanel({ pending: initial }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function act(id: string, status: "approved" | "rejected" | "more_info") {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/liquidations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note[id] || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      setPending((rows) => rows.filter((r) => r.id !== id));
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusyId(null);
    }
  }

  if (pending.length === 0) {
    return <p className="text-sm text-[var(--text-subtle)]">No pending capital liquidation requests</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {pending.map((row) => (
        <div key={row.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[var(--heading)]">{formatNaira(Number(row.principal_amount))}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Investment {row.investment_id.slice(0, 8)} · Member {row.user_id.slice(0, 8)}
              </p>
              <p className="mt-2 text-sm text-[var(--heading)]">{row.reason}</p>
              {row.comments ? <p className="mt-1 text-xs text-[var(--text-muted)]">{row.comments}</p> : null}
            </div>
            <StatusBadge status="pending" />
          </div>
          <textarea
            className="mt-3 w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 py-2 text-sm"
            rows={2}
            placeholder="Admin note (required for reject / more info)"
            value={note[row.id] ?? ""}
            onChange={(e) => setNote((n) => ({ ...n, [row.id]: e.target.value }))}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" className="gap-1" disabled={busyId === row.id} onClick={() => void act(row.id, "approved")}>
              <Check size={14} /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={busyId === row.id}
              onClick={() => void act(row.id, "rejected")}
            >
              <X size={14} /> Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1"
              disabled={busyId === row.id}
              onClick={() => void act(row.id, "more_info")}
            >
              <MessageSquare size={14} /> Request info
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
