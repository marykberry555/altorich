"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { FraudAlert } from "@/lib/admin-ops/types";
import { cn } from "@/lib/utils";

const severityStyles = {
  high: "border-red-500/30 bg-red-500/10",
  medium: "border-amber-500/30 bg-amber-500/10",
  low: "border-white/10 bg-white/5"
};

export function FraudDetectionCenter() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/fraud-alerts", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load fraud alerts.");
      }
      setAlerts(data.alerts ?? []);
    } catch (err) {
      setAlerts([]);
      setLoadError(err instanceof Error ? err.message : "Could not load fraud alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Intelligence surfaced for administrator review. No automatic account actions are taken.
      </p>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 size={16} className="animate-spin" /> Analysing patterns…
        </p>
      ) : loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-200">
          {loadError}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-zinc-900/80 p-8 text-center text-sm text-zinc-400">
          No fraud indicators detected at this time.
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={alert.href ?? adminAppPath("/members")}
                className={cn("block rounded-xl border p-4 transition hover:brightness-110", severityStyles[alert.severity])}
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" aria-hidden />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{alert.title}</p>
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{alert.description}</p>
                    {alert.memberName ? (
                      <p className="mt-1 text-xs text-zinc-500">{alert.memberName}</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
