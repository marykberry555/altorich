"use client";

import { buildSystemHealthArchitecture } from "@/lib/trust/system-health";
import type { SystemHealthStatus } from "@/lib/trust/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<SystemHealthStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  maintenance: "Maintenance",
  offline: "Offline",
  unavailable: "Monitoring pending"
};

const STATUS_STYLES: Record<SystemHealthStatus, string> = {
  operational: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  degraded: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  maintenance: "bg-slate-500/15 text-slate-700 dark:text-slate-200",
  offline: "bg-red-500/15 text-red-700 dark:text-red-300",
  unavailable: "bg-[var(--gray-100)] text-[var(--text-muted)]"
};

/** Internal health dashboard — does not fabricate live probe data. */
export function SystemHealthDashboard() {
  const components = buildSystemHealthArchitecture();

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Architecture for future monitoring integrations. Components without live probes show as unavailable rather than
        reporting synthetic metrics.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {components.map((component) => (
          <div key={component.id} className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{component.name}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[component.status])}>
                {STATUS_LABELS[component.status]}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-400">{component.description}</p>
            {component.message ? <p className="mt-2 text-xs text-zinc-500">{component.message}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
