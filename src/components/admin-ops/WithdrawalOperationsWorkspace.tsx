"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Flag, Loader2, Pause, Check, X } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { payoutStatusLabel, payoutStatusVariant } from "@/lib/payout/status";
import { adminAppPath } from "@/lib/admin-app/constants";
import { SettlementQueueAdmin } from "@/components/admin/SettlementQueueAdmin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminConfirmDialog } from "./AdminConfirmDialog";
import type { Withdrawal } from "@/types/database";

export function WithdrawalOperationsWorkspace() {
  const [pending, setPending] = useState<Withdrawal[]>([]);
  const [recent, setRecent] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; status: string; title: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const wdRes = await fetch("/api/admin/withdrawals/list", {
        cache: "no-store",
        credentials: "same-origin"
      });
      const data = await wdRes.json().catch(() => ({}));
      if (!wdRes.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load withdrawals.");
      }
      setPending(data.pending ?? []);
      setRecent(data.recent ?? []);
    } catch (err) {
      setPending([]);
      setRecent([]);
      setLoadError(err instanceof Error ? err.message : "Could not load withdrawals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-AltoRich-Client": "admin-app"
        },
        credentials: "same-origin",
        body: JSON.stringify({ status })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Update failed");
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 size={16} className="animate-spin" /> Loading withdrawals…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <SettlementQueueAdmin />

      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{loadError}</div>
      ) : null}
      {actionError ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{actionError}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Open withdrawal requests ({pending.length})</h2>
        <a href="/api/admin/export?type=withdrawals" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline">
          <Download size={12} /> Export CSV
        </a>
      </div>

      {!loadError && pending.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-8 text-center text-sm text-zinc-400">
          No open withdrawal requests in queue.
        </div>
      ) : (
        <ul className="space-y-3">
          {pending.map((w) => (
            <li key={w.id} className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold tabular-nums text-white">{formatNaira(Number(w.amount))}</p>
                    <Badge variant={payoutStatusVariant(payoutStatusLabel(w))}>{payoutStatusLabel(w)}</Badge>
                    {"queue_number" in w && w.queue_number ? (
                      <span className="text-xs text-zinc-500">Queue #{String(w.queue_number)}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {w.bank_name} · {w.account_number}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Requested {new Date(w.created_at).toLocaleString("en-NG")}
                    {w.settlement_reference ? ` · Ref ${w.settlement_reference}` : ""}
                  </p>
                  {"estimated_processing_at" in w && w.estimated_processing_at ? (
                    <p className="mt-1 text-xs text-emerald-400/80">
                      Est. settlement {new Date(String(w.estimated_processing_at)).toLocaleString("en-NG")}
                    </p>
                  ) : null}
                </div>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={selected.has(w.id)}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(w.id)) next.delete(w.id);
                        else next.add(w.id);
                        return next;
                      })
                    }
                  />
                  Select
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={busy === w.id} onClick={() => setConfirm({ id: w.id, status: "paid", title: "Mark withdrawal as paid?" })}>
                  <Check size={14} /> Approve / Paid
                </Button>
                <Button size="sm" variant="outline" disabled={busy === w.id} onClick={() => setConfirm({ id: w.id, status: "rejected", title: "Reject this withdrawal?" })}>
                  <X size={14} /> Reject
                </Button>
                <Button size="sm" variant="outline" disabled title="Hold workflow not available">
                  <Pause size={14} /> Hold
                </Button>
                <Button size="sm" variant="outline" disabled title="Flag for review">
                  <Flag size={14} /> Flag
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Recent withdrawals</h2>
          <ul className="space-y-2 text-sm text-zinc-400">
            {recent.slice(0, 15).map((w) => (
              <li key={w.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
                <span>{formatNaira(Number(w.amount))} · {w.bank_name}</span>
                <span>{w.status} · {new Date(w.created_at).toLocaleDateString("en-NG")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        destructive={confirm?.status === "rejected"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && void updateStatus(confirm.id, confirm.status)}
      />
    </div>
  );
}
