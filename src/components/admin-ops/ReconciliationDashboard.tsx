"use client";

import { formatNaira } from "@/lib/domain";
import { BankReconciliationPanel } from "@/components/admin-app/BankReconciliationPanel";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type ReconMetrics = {
  pendingDepositReviews: number;
  pendingWithdrawals: number;
  depositsThisMonth: number;
  withdrawalsThisMonth: number;
  todayDepositsAmount: number;
  todayWithdrawalsAmount: number;
};

export function ReconciliationDashboard() {
  const [metrics, setMetrics] = useState<ReconMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/live-metrics", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load reconciliation summary.");
      }
      setMetrics({
        pendingDepositReviews: data.pendingDepositReviews ?? 0,
        pendingWithdrawals: data.pendingWithdrawals ?? 0,
        depositsThisMonth: data.depositsThisMonth ?? 0,
        withdrawalsThisMonth: data.withdrawalsThisMonth ?? 0,
        todayDepositsAmount: data.todayDepositsAmount ?? 0,
        todayWithdrawalsAmount: data.todayWithdrawalsAmount ?? 0
      });
    } catch (err) {
      setMetrics(null);
      setLoadError(err instanceof Error ? err.message : "Could not load reconciliation summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 size={16} className="animate-spin" /> Loading reconciliation summary…
        </p>
      ) : loadError ? (
        <p className="text-sm text-red-300">{loadError}</p>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Pending reconciliation</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {metrics.pendingDepositReviews + metrics.pendingWithdrawals} items
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Daily totals</p>
            <p className="mt-1 text-sm text-zinc-300">
              In {formatNaira(metrics.todayDepositsAmount)} · Out {formatNaira(metrics.todayWithdrawalsAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Monthly totals</p>
            <p className="mt-1 text-sm text-zinc-300">
              In {formatNaira(metrics.depositsThisMonth)} · Out {formatNaira(metrics.withdrawalsThisMonth)}
            </p>
          </div>
        </div>
      ) : null}

      <BankReconciliationPanel />
    </div>
  );
}
