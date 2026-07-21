"use client";

import { useEffect, useState } from "react";
import type { TransparencyPlatformMetrics } from "@/services/transparency/transparency.service";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function TransparencyMetricsGrid({ className }: Props) {
  const [payload, setPayload] = useState<TransparencyPlatformMetrics | null>(null);

  useEffect(() => {
    fetch("/api/transparency/metrics")
      .then((res) => res.json())
      .then(setPayload)
      .catch(() => undefined);
  }, []);

  const metrics = payload?.metrics ?? [];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {metrics.map((metric) => (
        <Card key={metric.id} variant="elevated" padding="md" className="h-full">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">{metric.label}</p>
          {metric.available && metric.value ? (
            <p className="mt-2 text-xl font-bold text-[var(--heading)]">{metric.value}</p>
          ) : (
            <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">Not published yet</p>
          )}
          {metric.hint ? <p className="mt-2 text-xs leading-relaxed text-[var(--text-subtle)]">{metric.hint}</p> : null}
        </Card>
      ))}
    </div>
  );
}
