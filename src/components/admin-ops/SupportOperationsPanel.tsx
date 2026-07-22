"use client";

import { useCallback, useEffect, useState } from "react";
import { Headphones, Loader2 } from "lucide-react";
import { COMPANY } from "@/lib/company";
import type { SupportOpsMetrics } from "@/lib/admin-ops/types";

export function SupportOperationsPanel() {
  const [metrics, setMetrics] = useState<SupportOpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/live-metrics", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load support metrics.");
      }
      setMetrics({
        openTickets: data.supportItemsOpen ?? 0,
        pendingReplies: 0,
        resolvedToday: 0,
        averageResolutionHours: null,
        commonIssues: [
          { label: "Funding & deposits", count: data.pendingDepositReviews ?? 0 },
          { label: "Withdrawals & settlements", count: data.pendingWithdrawals ?? 0 },
          { label: "Account verification", count: data.pendingKyc ?? 0 }
        ].filter((i) => i.count > 0)
      });
    } catch (err) {
      setMetrics(null);
      setLoadError(err instanceof Error ? err.message : "Could not load support metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-5 text-sm text-zinc-300">
        <p className="flex items-center gap-2">
          <Headphones size={16} className="text-emerald-400" />
          Contact form messages route to <strong className="text-white">{COMPANY.supportEmail}</strong>.
        </p>
        <p className="mt-2 text-zinc-400">Full ticketing integration architecture is prepared for a future release.</p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 size={16} className="animate-spin" /> Loading support metrics…
        </p>
      ) : loadError ? (
        <p className="text-sm text-red-300">{loadError}</p>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Open items</p>
            <p className="mt-1 text-2xl font-semibold text-white">{metrics.openTickets}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Pending replies</p>
            <p className="mt-1 text-2xl font-semibold text-white">{metrics.pendingReplies}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Resolved today</p>
            <p className="mt-1 text-2xl font-semibold text-white">{metrics.resolvedToday}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <p className="text-xs text-zinc-500">Avg resolution</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {metrics.averageResolutionHours != null ? `${metrics.averageResolutionHours}h` : "—"}
            </p>
          </div>
        </div>
      ) : null}

      {metrics && metrics.commonIssues.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Operational drivers</h2>
          <ul className="space-y-2">
            {metrics.commonIssues.map((issue) => (
              <li key={issue.label} className="flex justify-between rounded-lg border border-white/5 px-4 py-2 text-sm">
                <span className="text-zinc-300">{issue.label}</span>
                <span className="font-semibold tabular-nums text-white">{issue.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
