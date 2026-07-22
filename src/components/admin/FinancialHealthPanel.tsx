"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type HealthSnapshot = {
  generatedAt: string;
  thresholds: { depositStuckMinutes: number; withdrawalStuckMinutes: number };
  counts: {
    stuckDeposits: number;
    stuckWithdrawals: number;
    stuckReferralPayouts: number;
    openReconcileFailures: number;
    duplicateAttempts24h: number;
    openWithdrawalQueue: number;
    withdrawalsProcessing: number;
  };
  stuckDeposits: Array<{
    id: string;
    amount: number;
    workflow_phase: string;
    workflow_updated_at: string;
    workflow_error?: string | null;
    reference: string;
  }>;
  stuckWithdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    settlement_reference?: string | null;
    processing_started_at?: string | null;
  }>;
  stuckReferralPayouts: Array<{
    id: string;
    amount: number;
    status: string;
    settlement_reference?: string | null;
  }>;
  reconcileFailures: Array<{
    id: string;
    message: string;
    entity_id?: string | null;
    reference?: string | null;
    created_at: string;
  }>;
  duplicateAttempts: Array<{
    id: string;
    message: string;
    entity_id?: string | null;
    reference?: string | null;
    created_at: string;
  }>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    severity: string;
    message: string;
    created_at: string;
    resolved_at?: string | null;
  }>;
};

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(ms / 60_000));
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export function FinancialHealthPanel() {
  const [data, setData] = useState<HealthSnapshot | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/financial-health", { cache: "no-store", credentials: "same-origin" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Could not load financial health.");
      }
      setData(json as HealthSnapshot);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load financial health.");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 20_000);
    return () => clearInterval(timer);
  }, [load]);

  async function recover() {
    setBusy("recover");
    setMessage("");
    const res = await fetch("/api/admin/financial-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recover_deposits", olderThanMinutes: 5, limit: 25 })
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    setMessage(res.ok ? `Recovery finished · ${(json.results ?? []).length} deposit(s) attempted.` : "Recovery failed.");
    await load();
  }

  async function runAlerts() {
    setBusy("alerts");
    setMessage("");
    const res = await fetch("/api/admin/financial-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "evaluate_alerts", cooldownMs: 0 })
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setMessage("Alert evaluation failed.");
    } else {
      const notified = (json.sent ?? []).filter((s: { notificationId: string | null }) => s.notificationId).length;
      setMessage(`Alerts evaluated · ${json.drafts ?? 0} condition(s) · ${notified} notification(s) sent.`);
    }
    await load();
  }

  async function resolveEvent(eventId: string) {
    setBusy(eventId);
    await fetch("/api/admin/financial-health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_event", eventId })
    });
    setBusy(null);
    await load();
  }

  if (!data) {
    return (
      <Card variant="elevated" padding="md">
        {loadError ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600 dark:text-red-300">{loadError}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 size={16} className="animate-spin" /> Loading financial health…
          </p>
        )}
      </Card>
    );
  }

  const { counts } = data;
  const alertCount =
    counts.stuckDeposits + counts.stuckWithdrawals + counts.stuckReferralPayouts + counts.openReconcileFailures;

  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--heading)]">Financial ops health</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Stuck deposits (&gt;{data.thresholds.depositStuckMinutes}m) · stuck processing (&gt;
              {data.thresholds.withdrawalStuckMinutes}m) · reconcile + duplicate visibility
            </p>
            <p className="mt-1 text-xs text-[var(--text-subtle)]">Updated {ago(data.generatedAt)} · auto-refresh 20s</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void load()}>
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy === "alerts"} onClick={() => void runAlerts()}>
              Run alerts now
            </Button>
            <Button type="button" size="sm" disabled={busy === "recover"} onClick={() => void recover()}>
              Recover stuck deposits
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Stat label="Stuck deposits" value={String(counts.stuckDeposits)} alert={counts.stuckDeposits > 0} />
          <Stat label="Stuck withdrawals" value={String(counts.stuckWithdrawals)} alert={counts.stuckWithdrawals > 0} />
          <Stat
            label="Stuck referral payouts"
            value={String(counts.stuckReferralPayouts)}
            alert={counts.stuckReferralPayouts > 0}
          />
          <Stat
            label="Open reconcile failures"
            value={String(counts.openReconcileFailures)}
            alert={counts.openReconcileFailures > 0}
          />
          <Stat label="Duplicate attempts (24h)" value={String(counts.duplicateAttempts24h)} />
          <Stat label="Open withdrawal queue" value={String(counts.openWithdrawalQueue)} />
          <Stat label="Processing now" value={String(counts.withdrawalsProcessing)} />
          <Stat label="Health" value={alertCount === 0 ? "Clear" : `${alertCount} alerts`} alert={alertCount > 0} />
        </div>
        {message ? <p className="mt-3 text-sm text-[var(--emerald)]">{message}</p> : null}
      </Card>

      <Section title={`Stuck deposits (${data.stuckDeposits.length})`}>
        {data.stuckDeposits.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">None.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.stuckDeposits.map((d) => (
              <li key={d.id} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{d.workflow_phase}</Badge>
                  <span className="currency-ngn font-semibold">{formatNaira(Number(d.amount))}</span>
                  <span className="font-mono text-xs">{d.reference}</span>
                  <span className="text-xs text-[var(--text-subtle)]">{ago(d.workflow_updated_at)}</span>
                </div>
                {d.workflow_error ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{d.workflow_error}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Stuck withdrawals (${data.stuckWithdrawals.length})`}>
        {data.stuckWithdrawals.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">None.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.stuckWithdrawals.map((w) => (
              <li key={w.id} className="rounded-xl border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="navy">{w.status}</Badge>
                  <span className="currency-ngn font-semibold">{formatNaira(Number(w.amount))}</span>
                  <span className="font-mono text-xs">{w.settlement_reference ?? w.id.slice(0, 8)}</span>
                  {w.processing_started_at ? (
                    <span className="text-xs text-[var(--text-subtle)]">{ago(w.processing_started_at)}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Reconcile failures (${data.reconcileFailures.length})`}>
        {data.reconcileFailures.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">None open in last 24h.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.reconcileFailures.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[var(--border)] p-3">
                <div>
                  <p className="font-medium text-[var(--heading)]">{e.message}</p>
                  <p className="mt-1 text-xs text-[var(--text-subtle)]">
                    {e.reference ?? e.entity_id} · {ago(e.created_at)}
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" disabled={busy === e.id} onClick={() => void resolveEvent(e.id)}>
                  Resolve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Duplicate attempts (24h · ${data.duplicateAttempts.length})`}>
        {data.duplicateAttempts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">None recorded — visibility only, not errors.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.duplicateAttempts.slice(0, 20).map((e) => (
              <li key={e.id} className="rounded-xl border border-[var(--border)] p-3">
                <p className="text-[var(--heading)]">{e.message}</p>
                <p className="mt-1 text-xs text-[var(--text-subtle)]">
                  {e.reference ?? e.entity_id} · {ago(e.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="elevated" padding="md">
      <h3 className="font-semibold text-[var(--heading)]">{title}</h3>
      <div className="mt-3">{children}</div>
    </Card>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">{label}</p>
      <p className={`mt-1 font-semibold ${alert ? "text-amber-700 dark:text-amber-300" : "text-[var(--heading)]"}`}>{value}</p>
    </div>
  );
}
