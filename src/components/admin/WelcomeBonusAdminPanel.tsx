"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, RefreshCw } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Snapshot = {
  enabled: boolean;
  amount: number;
  maxAllocations: number;
  allocated: number;
  remaining: number;
  totalLiability: number;
  counts: {
    locked: number;
    available: number;
    awaitingSettlement: number;
    paid: number;
    cancelled: number;
  };
  recent: Array<{
    id: string;
    user_id: string;
    allocation_number: number;
    amount: number;
    status: string;
    expected_unlock_at: string;
    settlement_reference: string | null;
  }>;
};

export function WelcomeBonusAdminPanel() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/welcome-bonus", { cache: "no-store" });
    if (!res.ok) return;
    setData((await res.json()) as Snapshot);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setEnabled(enabled: boolean) {
    setBusy(enabled ? "enable" : "disable");
    setMessage("");
    const res = await fetch("/api/admin/welcome-bonus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_config", enabled })
    });
    setBusy(null);
    setMessage(res.ok ? (enabled ? "Promotion enabled." : "Promotion disabled.") : "Update failed.");
    await load();
  }

  if (!data) {
    return (
      <Card variant="elevated" padding="md">
        <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 size={16} className="animate-spin" /> Loading Welcome Bonus…
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-[var(--emerald)]" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-[var(--heading)]">Welcome Bonus programme</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                First {data.maxAllocations} verified members · {formatNaira(data.amount)} each · separate WB wallet
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
              <RefreshCw size={14} /> Refresh
            </Button>
            {data.enabled ? (
              <Button type="button" size="sm" variant="outline" disabled={busy === "disable"} onClick={() => void setEnabled(false)}>
                Disable promotion
              </Button>
            ) : (
              <Button type="button" size="sm" disabled={busy === "enable"} onClick={() => void setEnabled(true)}>
                Enable promotion
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Stat label="Issued" value={`${data.allocated} / ${data.maxAllocations}`} />
          <Stat label="Remaining slots" value={String(data.remaining)} />
          <Stat label="Promotional liability" value={formatNaira(data.totalLiability)} />
          <Stat label="Status" value={data.enabled ? "Open" : "Closed"} alert={!data.enabled} />
          <Stat label="Locked" value={String(data.counts.locked)} />
          <Stat label="Unlocked" value={String(data.counts.available)} />
          <Stat label="Awaiting settlement" value={String(data.counts.awaitingSettlement)} />
          <Stat label="Paid" value={String(data.counts.paid)} />
        </div>
        {message ? <p className="mt-3 text-sm text-[var(--emerald)]">{message}</p> : null}
      </Card>

      <Card variant="elevated" padding="md">
        <h3 className="text-sm font-semibold text-[var(--heading)]">Allocations</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--text-subtle)]">
              <tr>
                <th className="px-2 py-1.5 font-medium">#</th>
                <th className="px-2 py-1.5 font-medium">Member</th>
                <th className="px-2 py-1.5 font-medium">Status</th>
                <th className="px-2 py-1.5 font-medium">Unlock</th>
                <th className="px-2 py-1.5 font-medium">Settlement ref</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-[var(--text-muted)]">
                    No Welcome Bonus allocations yet
                  </td>
                </tr>
              ) : (
                data.recent.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-2 py-2 tabular-nums">{row.allocation_number}</td>
                    <td className="px-2 py-2 font-mono text-xs">{row.user_id.slice(0, 8)}</td>
                    <td className="px-2 py-2">{row.status}</td>
                    <td className="px-2 py-2 text-xs text-[var(--text-muted)]">
                      {new Date(row.expected_unlock_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">{row.settlement_reference ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <p className="text-xs text-[var(--text-subtle)]">{label}</p>
      <p className={`mt-1 font-semibold tabular-nums ${alert ? "text-amber-600" : "text-[var(--heading)]"}`}>
        {value}
      </p>
    </div>
  );
}
