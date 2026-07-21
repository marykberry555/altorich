"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import type { TransparencyOverview } from "@/services/transparency/transparency.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  initialData?: TransparencyOverview | null;
};

function formatMinutes(minutes: number | null) {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function MetricCard({
  label,
  value,
  sub,
  empty
}: {
  label: string;
  value: string;
  sub?: string;
  empty?: boolean;
}) {
  return (
    <Card variant="elevated" padding="md" className="h-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">{label}</p>
      <p className={cn("mt-2 text-xl font-bold tabular-nums text-[var(--heading)] sm:text-2xl", empty && "text-base font-medium")}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p> : null}
    </Card>
  );
}

export function TransparencyLiveOverview({ className, initialData = null }: Props) {
  const [data, setData] = useState<TransparencyOverview | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/transparency/overview")
        .then((res) => res.json())
        .then((json: TransparencyOverview) => {
          if (!cancelled) {
            setData(json);
            setError(false);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const unavailable =
    !data ||
    (data.todayDeposits === null &&
      data.todayWithdrawals === null &&
      data.depositsApprovedToday === null &&
      data.pendingDeposits === null);

  const showEmpty = error || unavailable;

  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <section className={cn(className)} aria-labelledby="live-overview-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-[var(--emerald)]" aria-hidden />
            <h2 id="live-overview-heading" className="text-xl font-bold text-[var(--heading)] sm:text-2xl">
              Live platform overview
            </h2>
            {data?.live ? (
              <Badge variant="emerald" className="gap-1">
                <span className="live-dot" aria-hidden />
                Live
              </Badge>
            ) : (
              <Badge variant="outline">Monitoring</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Updated moments ago · Last refresh {lastUpdated}
            {loading ? " · Refreshing…" : null}
          </p>
        </div>
        <Link
          href="/status"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--emerald)] hover:underline"
        >
          System status
          <RefreshCw size={14} aria-hidden />
        </Link>
      </div>

      {showEmpty ? (
        <Card variant="outline" padding="lg" className="mt-6 text-center">
          <p className="font-medium text-[var(--heading)]">No activity available</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Operational metrics appear here when live platform data is available. Nothing is estimated or fabricated.
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MetricCard label="Today's deposits" value={String(data!.todayDeposits ?? "—")} sub={data!.todayDepositsAmount != null ? formatNaira(data!.todayDepositsAmount) : undefined} />
          <MetricCard label="Today's withdrawals" value={String(data!.todayWithdrawals ?? "—")} sub={data!.todayWithdrawalsAmount != null ? formatNaira(data!.todayWithdrawalsAmount) : undefined} />
          <MetricCard label="Deposits approved" value={String(data!.depositsApprovedToday ?? "—")} sub="Today" />
          <MetricCard label="Withdrawals processed" value={String(data!.withdrawalsProcessedToday ?? "—")} sub="Today" />
          <MetricCard label="Pending deposits" value={data!.pendingDeposits != null ? formatNaira(data!.pendingDeposits) : "—"} />
          <MetricCard label="Pending withdrawals" value={String(data!.pendingWithdrawals ?? "—")} />
          <MetricCard label="Avg deposit approval" value={formatMinutes(data!.averageDepositApprovalMinutes)} sub="Last 90 days" />
          <MetricCard label="Avg withdrawal processing" value={formatMinutes(data!.averageWithdrawalProcessingMinutes)} sub="Last 90 days" />
          <MetricCard label="Avg support response" value="Not published" empty />
          <MetricCard label="Platform availability" value={data!.platformAvailabilityPercent != null ? `${data!.platformAvailabilityPercent}%` : "Not published"} empty={data!.platformAvailabilityPercent == null} />
          <MetricCard label="Settlement status" value={data!.settlementStatus ?? "—"} />
        </div>
      )}
    </section>
  );
}
