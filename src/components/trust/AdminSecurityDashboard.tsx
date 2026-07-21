"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";
import { AdminInstallCta } from "@/components/admin-app/AdminInstallCta";
import type { AdminSecurityTimelineEntry } from "@/lib/trust/types";

type SecuritySnapshot = {
  failedLoginAttempts: Array<{ id: string; ip_address: string | null; metadata: Record<string, unknown>; created_at: string }>;
  lockedAccounts: Array<{ id: string; full_name: string; username: string | null; account_status: string; updated_at: string }>;
  newDeviceLogins: Array<{ id: string; member_name: string; device_type: string | null; browser: string | null; city: string | null; country: string | null; created_at: string }>;
  adminLogins: Array<{ id: string; member_name: string; city: string | null; country: string | null; created_at: string }>;
  suspiciousActivity: Array<{ id: string; event_type: string; metadata: Record<string, unknown>; created_at: string }>;
  recentPasswordChanges: Array<{ id: string; created_at: string }>;
  recentPinChanges: Array<{ id: string; created_at: string }>;
  recentEmailChanges: Array<{ id: string; created_at: string }>;
  recentWithdrawals: Array<{ id: string; user_id: string; amount: number; status: string; created_at: string }>;
  recentFunding: Array<{ id: string; user_id: string; amount: number; status: string; created_at: string }>;
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString("en-NG");
}

type Filter = "all" | AdminSecurityTimelineEntry["category"];

export function AdminSecurityDashboard() {
  const [data, setData] = useState<SecuritySnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/security", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminRealtime(() => void load(), ["login_activity"]);

  const timeline = useMemo(() => {
    if (!data) return [] as AdminSecurityTimelineEntry[];
    const entries: AdminSecurityTimelineEntry[] = [];

    for (const row of data.failedLoginAttempts) {
      entries.push({
        id: `failed-${row.id}`,
        category: "login",
        title: "Failed admin login attempt",
        detail: row.ip_address ?? "Unknown IP",
        timestamp: row.created_at,
        severity: "warning"
      });
    }
    for (const row of data.adminLogins) {
      entries.push({
        id: `admin-login-${row.id}`,
        category: "login",
        title: "Admin login",
        actorLabel: row.member_name,
        detail: [row.city, row.country].filter(Boolean).join(", ") || undefined,
        timestamp: row.created_at,
        severity: "info"
      });
    }
    for (const row of data.newDeviceLogins) {
      entries.push({
        id: `device-${row.id}`,
        category: "login",
        title: "New device login",
        actorLabel: row.member_name,
        detail: [row.device_type, row.browser, row.city, row.country].filter(Boolean).join(" · "),
        timestamp: row.created_at,
        severity: "warning"
      });
    }
    for (const row of data.recentPasswordChanges) {
      entries.push({
        id: `pwd-${row.id}`,
        category: "credential",
        title: "Password changed",
        timestamp: row.created_at,
        severity: "info"
      });
    }
    for (const row of data.recentPinChanges) {
      entries.push({
        id: `pin-${row.id}`,
        category: "credential",
        title: "PIN changed",
        timestamp: row.created_at,
        severity: "info"
      });
    }
    for (const row of data.recentEmailChanges) {
      entries.push({
        id: `email-${row.id}`,
        category: "credential",
        title: "Email changed",
        timestamp: row.created_at,
        severity: "info"
      });
    }
    for (const row of data.suspiciousActivity) {
      entries.push({
        id: `susp-${row.id}`,
        category: "flagged",
        title: row.event_type,
        timestamp: row.created_at,
        severity: "critical"
      });
    }
    for (const row of data.lockedAccounts) {
      entries.push({
        id: `locked-${row.id}`,
        category: "flagged",
        title: `Restricted account: ${row.full_name}`,
        detail: row.account_status,
        timestamp: row.updated_at,
        severity: "warning"
      });
    }
    for (const row of data.recentWithdrawals) {
      entries.push({
        id: `wd-${row.id}`,
        category: "sensitive",
        title: "Withdrawal activity",
        detail: `${formatNaira(row.amount)} · ${row.status}`,
        timestamp: row.created_at,
        severity: "info"
      });
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return timeline.filter((entry) => {
      if (filter !== "all" && entry.category !== filter) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        (entry.detail?.toLowerCase().includes(q) ?? false) ||
        (entry.actorLabel?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [timeline, filter, query]);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "login", label: "Logins" },
    { id: "credential", label: "Credentials" },
    { id: "sensitive", label: "Sensitive" },
    { id: "flagged", label: "Flagged" },
    { id: "permission", label: "Permissions" },
    { id: "config", label: "Config" }
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Security dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Searchable timeline of admin logins, credential changes, flagged accounts, and sensitive activity.
        </p>
      </header>

      <AdminInstallCta />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search security events…"
          aria-label="Search security events"
          className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:bg-white/5"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Timeline</h2>
        {!filtered.length ? (
          <p className="text-sm text-zinc-400">No matching events.</p>
        ) : (
          <ul className="max-h-[480px] space-y-2 overflow-y-auto">
            {filtered.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-white/5 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-white">{entry.title}</p>
                  <span className="text-xs capitalize text-zinc-500">{entry.category}</span>
                </div>
                {entry.actorLabel ? <p className="text-xs text-zinc-400">{entry.actorLabel}</p> : null}
                {entry.detail ? <p className="text-xs text-zinc-500">{entry.detail}</p> : null}
                <p className="mt-1 text-xs text-zinc-600">{formatWhen(entry.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Locked / restricted accounts</h2>
          {!data?.lockedAccounts.length ? (
            <p className="text-sm text-zinc-400">None</p>
          ) : (
            data.lockedAccounts.map((row) => (
              <Link
                key={row.id}
                href={adminAppPath(`/members/${row.id}`)}
                className="mb-2 block rounded-lg border border-white/5 px-3 py-2 hover:bg-white/5"
              >
                <p className="font-medium text-white">{row.full_name}</p>
                <p className="text-xs capitalize text-zinc-400">{row.account_status}</p>
              </Link>
            ))
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Recent funding</h2>
          {!data?.recentFunding.length ? (
            <p className="text-sm text-zinc-400">None</p>
          ) : (
            data.recentFunding.map((row) => (
              <div key={row.id} className="mb-2 rounded-lg border border-white/5 px-3 py-2 text-sm text-zinc-300">
                {formatNaira(row.amount)} · {row.status} · {formatWhen(row.created_at)}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
