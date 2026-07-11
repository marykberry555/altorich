"use client";

import { useEffect, useState } from "react";

type ActivityRow = {
  id: string;
  member_name: string;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
};

export function AdminActivityPageClient() {
  const [rows, setRows] = useState<ActivityRow[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/login-activity?limit=100", { cache: "no-store" });
      if (res.ok) setRows(await res.json());
    }
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Login activity</h1>
        <p className="mt-2 text-sm text-zinc-400">Successful sign-ins with device and approximate location metadata.</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Browser / OS</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No login activity recorded yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium text-white">{row.member_name}</td>
                  <td className="px-4 py-3 text-zinc-300">{new Date(row.created_at).toLocaleString("en-NG")}</td>
                  <td className="px-4 py-3 text-zinc-300">{[row.city, row.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 capitalize text-zinc-300">{row.device_type ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {row.browser ?? "—"} / {row.operating_system ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{row.ip_address ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
