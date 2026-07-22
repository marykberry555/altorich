"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { buildExecutiveKpis } from "@/lib/admin-ops/executive-kpis";
import { adminAppPath } from "@/lib/admin-app/constants";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";
import { AdminKpiCard } from "./AdminKpiCard";
import { OperationsFeedPanel } from "./OperationsFeedPanel";
import type { AdminLiveMetrics } from "@/services/admin/live-metrics.service";

export function ExecutiveOperationsDashboard() {
  const [metrics, setMetrics] = useState<AdminLiveMetrics | null>(null);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-metrics", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load executive metrics.");
      }
      setMetrics(data as AdminLiveMetrics);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load executive metrics.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useAdminRealtime(() => void refresh());

  const kpis = useMemo(() => (metrics ? buildExecutiveKpis(metrics) : []), [metrics]);

  return (
    <div className="space-y-6">
      {loadError ? <p className="text-sm text-red-300">{loadError}</p> : null}
      <section aria-label="Executive KPIs">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Command center</h2>
          <Link href={adminAppPath("/operations")} className="text-xs text-emerald-400 hover:underline">
            Live feed →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {kpis.map((kpi) => (
            <AdminKpiCard key={kpi.id} {...kpi} />
          ))}
        </div>
      </section>

      <OperationsFeedPanel compact limit={10} />
    </div>
  );
}
