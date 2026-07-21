"use client";

import { useEffect, useState } from "react";
import type { TransparencyStatusPayload } from "@/services/transparency/transparency.service";
import { STATUS_LABELS, STATUS_STYLES, type ServiceStatus } from "@/lib/transparency/system-status";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
  showOverall?: boolean;
};

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    maintenance: "bg-slate-400",
    offline: "bg-red-500"
  };
  return <span className={cn("size-2.5 shrink-0 rounded-full", colors[status])} aria-hidden />;
}

export function SystemStatusGrid({ className, compact = false, showOverall = true }: Props) {
  const [payload, setPayload] = useState<TransparencyStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transparency/status")
      .then((res) => res.json())
      .then((json: TransparencyStatusPayload) => {
        if (!cancelled) setPayload(json);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const services = payload?.services ?? [];
  const overall = payload?.overall ?? "operational";

  return (
    <div className={className}>
      {showOverall ? (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold", STATUS_STYLES[overall])}>
            <StatusDot status={overall} />
            {STATUS_LABELS[overall]}
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? "Checking services…" : `Last updated ${payload?.lastUpdated ? new Date(payload.lastUpdated).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}`}
          </p>
        </div>
      ) : null}

      <div className={cn("grid gap-3", compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
        {services.map((service) => (
          <Card key={service.id} variant="elevated" padding="md" className="h-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--heading)]">{service.name}</p>
                {!compact ? (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{service.description}</p>
                ) : null}
              </div>
              <div className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", STATUS_STYLES[service.status])}>
                <StatusDot status={service.status} />
                {STATUS_LABELS[service.status]}
              </div>
            </div>
            {service.message ? (
              <p className="mt-3 text-xs text-[var(--text-muted)]">{service.message}</p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
