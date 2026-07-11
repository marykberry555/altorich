"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/domain";
import { adminAppPath } from "@/lib/admin-app/constants";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

export function AdminSecurityPageClient() {
  const [data, setData] = useState<SecuritySnapshot | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/security", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminRealtime(() => void load(), ["login_activity"]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Security center</h1>
        <p className="mt-2 text-sm text-zinc-400">Failed logins, locked accounts, credential changes, and funding activity.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Failed login attempts">
          {!data?.failedLoginAttempts.length ? (
            <p className="text-zinc-400">None recorded</p>
          ) : (
            data.failedLoginAttempts.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/5 px-3 py-2 text-zinc-300">
                {row.ip_address ?? "Unknown IP"} · {formatWhen(row.created_at)}
              </div>
            ))
          )}
        </Section>

        <Section title="Locked / restricted accounts">
          {!data?.lockedAccounts.length ? (
            <p className="text-zinc-400">None</p>
          ) : (
            data.lockedAccounts.map((row) => (
              <Link key={row.id} href={adminAppPath(`/members/${row.id}`)} className="block rounded-lg border border-white/5 px-3 py-2 hover:bg-white/5">
                <p className="font-medium text-white">{row.full_name}</p>
                <p className="text-xs capitalize text-zinc-400">{row.account_status}</p>
              </Link>
            ))
          )}
        </Section>

        <Section title="New device logins">
          {!data?.newDeviceLogins.length ? (
            <p className="text-zinc-400">None</p>
          ) : (
            data.newDeviceLogins.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                <p className="font-medium text-white">{row.member_name}</p>
                <p className="text-xs text-zinc-400">
                  {[row.city, row.country].filter(Boolean).join(", ") || "Location unavailable"} · {row.device_type} · {row.browser}
                </p>
              </div>
            ))
          )}
        </Section>

        <Section title="Admin logins">
          {!data?.adminLogins.length ? (
            <p className="text-zinc-400">None</p>
          ) : (
            data.adminLogins.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                <p className="font-medium text-white">{row.member_name}</p>
                <p className="text-xs text-zinc-400">{[row.city, row.country].filter(Boolean).join(", ") || "—"} · {formatWhen(row.created_at)}</p>
              </div>
            ))
          )}
        </Section>

        <Section title="Suspicious activity">
          {!data?.suspiciousActivity.length ? (
            <p className="text-zinc-400">None flagged</p>
          ) : (
            data.suspiciousActivity.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                <p className="font-medium text-white">{row.event_type}</p>
                <p className="text-xs text-zinc-400">{formatWhen(row.created_at)}</p>
              </div>
            ))
          )}
        </Section>

        <Section title="Recent credential changes">
          <p className="text-zinc-400">Password: {data?.recentPasswordChanges.length ?? 0}</p>
          <p className="text-zinc-400">PIN: {data?.recentPinChanges.length ?? 0}</p>
          <p className="text-zinc-400">Email: {data?.recentEmailChanges.length ?? 0}</p>
        </Section>

        <Section title="Recent withdrawals">
          {!data?.recentWithdrawals.length ? (
            <p className="text-zinc-400">None</p>
          ) : (
            data.recentWithdrawals.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                {formatNaira(row.amount)} · {row.status} · {formatWhen(row.created_at)}
              </div>
            ))
          )}
        </Section>

        <Section title="Recent funding">
          {!data?.recentFunding.length ? (
            <p className="text-zinc-400">None</p>
          ) : (
            data.recentFunding.map((row) => (
              <div key={row.id} className="rounded-lg border border-white/5 px-3 py-2">
                {formatNaira(row.amount)} · {row.status} · {formatWhen(row.created_at)}
              </div>
            ))
          )}
        </Section>
      </div>
    </div>
  );
}
