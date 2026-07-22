"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type QueueRow = {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  status: string;
  statusLabel: string;
  liveQueuePosition: number;
  liveBatchNumber: number;
  liveEstimatedProcessingAt: string;
  settlement_reference?: string | null;
  request_type?: string;
};

type Dashboard = {
  config: {
    batch_size: number;
    batch_interval_minutes: number;
    paused: boolean;
    opens_weekday: number;
    opens_hour: number;
    opens_minute: number;
    max_daily_processing_limit: number | null;
  };
  queue: QueueRow[];
  stats: {
    completedToday: number;
    remainingToday: number;
    requestsPerBatch: number;
    batchIntervalMinutes: number;
    estimatedCompletionAt: string;
    averageProcessingMs: number | null;
    paused: boolean;
    opensLabel?: string;
    maxDailyProcessingLimit?: number | null;
    dailyCapRemaining?: number | null;
  };
};

function formatEta(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos"
  });
}

export function SettlementQueueAdmin() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [batchSize, setBatchSize] = useState("25");
  const [intervalMinutes, setIntervalMinutes] = useState("10");
  const [dailyLimit, setDailyLimit] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settlement-queue", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as Dashboard;
    setData(json);
    setBatchSize(String(json.config.batch_size));
    setIntervalMinutes(String(json.config.batch_interval_minutes));
    setDailyLimit(
      json.config.max_daily_processing_limit == null ? "" : String(json.config.max_daily_processing_limit)
    );
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 20_000);
    return () => clearInterval(timer);
  }, [load]);

  async function saveSettings(patch: {
    batch_size?: number;
    batch_interval_minutes?: number;
    paused?: boolean;
    max_daily_processing_limit?: number | null;
  }) {
    setBusy("settings");
    setMessage("");
    const res = await fetch("/api/admin/settlement-queue", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    setBusy(null);
    setMessage(res.ok ? "Settlement queue settings saved." : "Failed to save settings.");
    await load();
  }

  async function action(id: string, status: string) {
    setBusy(id + status);
    await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason: status === "rejected" ? "Rejected by admin" : undefined })
    });
    setBusy(null);
    await load();
  }

  if (!data) {
    return (
      <Card variant="elevated" padding="md">
        <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 size={16} className="animate-spin" /> Loading settlement queue…
        </p>
      </Card>
    );
  }

  const { stats, queue, config } = data;
  const opensLabel = stats.opensLabel ?? "Monday 9:00 AM";

  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--heading)]">Monday settlement queue</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Opens {opensLabel} · FIFO · {config.batch_size} per batch every {config.batch_interval_minutes}{" "}
              minutes
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={busy === "settings"}
            onClick={() => void saveSettings({ paused: !config.paused })}
          >
            {config.paused ? <Play size={14} /> : <Pause size={14} />}
            {config.paused ? "Resume processing" : "Pause processing"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Stat label="Completed today" value={String(stats.completedToday)} />
          <Stat label="Remaining today" value={String(stats.remainingToday)} />
          <Stat label="Requests / batch" value={String(stats.requestsPerBatch)} />
          <Stat label="Est. completion" value={formatEta(stats.estimatedCompletionAt)} />
          <Stat
            label="Avg processing"
            value={
              stats.averageProcessingMs != null
                ? `${Math.round(stats.averageProcessingMs / 60000)} min`
                : "—"
            }
          />
          <Stat label="Status" value={stats.paused ? "Paused" : "Active"} />
          <Stat
            label="Daily cap remaining"
            value={
              stats.maxDailyProcessingLimit == null
                ? "Unlimited"
                : String(stats.dailyCapRemaining ?? "—")
            }
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Batch size"
            type="number"
            min={1}
            value={batchSize}
            onChange={(e) => setBatchSize(e.target.value)}
          />
          <Input
            label="Batch interval (minutes)"
            type="number"
            min={1}
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(e.target.value)}
          />
          <Input
            label="Max daily processing (optional)"
            type="number"
            min={1}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            hint="Leave blank for unlimited"
          />
          <div className="flex items-end">
            <Button
              type="button"
              disabled={busy === "settings"}
              onClick={() =>
                void saveSettings({
                  batch_size: Number(batchSize),
                  batch_interval_minutes: Number(intervalMinutes),
                  max_daily_processing_limit: dailyLimit.trim() === "" ? null : Number(dailyLimit)
                })
              }
            >
              Save batch settings
            </Button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-[var(--emerald)]">{message}</p> : null}
      </Card>

      <Card variant="elevated" padding="md">
        <h3 className="font-semibold text-[var(--heading)]">Queue ({queue.length})</h3>
        {queue.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No open settlement requests.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {queue.map((row) => (
              <li key={row.id} className="rounded-xl border border-[var(--border)] p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[var(--heading)]">#{row.liveQueuePosition}</span>
                      <span className="currency-ngn font-semibold tabular-nums">{formatNaira(Number(row.amount))}</span>
                      <Badge variant="outline">Batch {row.liveBatchNumber}</Badge>
                      <Badge variant="navy">{row.statusLabel}</Badge>
                    </div>
                    <p className="mt-1 text-[var(--text-muted)]">
                      {row.bank_name} · {row.account_number}
                    </p>
                    {row.settlement_reference ? (
                      <p className="mt-1 font-mono text-xs text-[var(--heading)]">{row.settlement_reference}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-[var(--text-subtle)]">
                      ETA ≈ {formatEta(row.liveEstimatedProcessingAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "pending" || row.status === "scheduled" ? (
                      <Button type="button" size="sm" disabled={Boolean(busy)} onClick={() => void action(row.id, "approved")}>
                        Under review
                      </Button>
                    ) : null}
                    {row.status === "approved" || row.status === "pending" || row.status === "scheduled" ? (
                      <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void action(row.id, "processing")}>
                        Process
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" disabled={Boolean(busy)} onClick={() => void action(row.id, "paid")}>
                      Mark paid
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void action(row.id, "skip")}>
                      Skip
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void action(row.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--heading)]">{value}</p>
    </div>
  );
}
