"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";

type ActivityRow = {
  id: string;
  member_name: string;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  isp: string | null;
  created_at: string;
};

function locationLabel(row: ActivityRow) {
  return [row.city, row.region, row.country].filter(Boolean).join(", ") || "Location unavailable";
}

export function AdminActivityPageClient() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/login-activity?limit=100", { cache: "no-store", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load login activity.");
      }
      setRows(Array.isArray(data) ? data : (data.rows ?? []));
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load login activity.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminRealtime(() => void load(), ["login_activity"]);

  return (
    <div className="min-w-0 space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--admin-emerald-text)" }}>
          Monitoring
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--admin-heading)" }}>
          Login activity
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--admin-muted)" }}>
          Successful sign-ins with device and approximate IP-derived location.
        </p>
      </header>

      {/* Mobile: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {loadError ? (
          <li
            className="rounded-xl border px-4 py-8 text-center text-sm text-red-600 dark:text-red-300"
            style={{ borderColor: "var(--admin-border)" }}
          >
            {loadError}
          </li>
        ) : rows.length === 0 ? (
          <li
            className="rounded-xl border px-4 py-8 text-center text-sm"
            style={{ borderColor: "var(--admin-border)", color: "var(--admin-muted)" }}
          >
            No login activity recorded yet
          </li>
        ) : (
          rows.map((row) => (
            <li
              key={row.id}
              className="min-w-0 rounded-xl border p-4"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)" }}
            >
              <p className="font-medium" style={{ color: "var(--admin-heading)" }}>
                {row.member_name}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--admin-muted)" }}>
                {new Date(row.created_at).toLocaleString("en-NG")}
              </p>
              <dl className="mt-3 space-y-1.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--admin-subtle)" }}>Location</dt>
                  <dd className="min-w-0 text-right break-words" style={{ color: "var(--admin-text)" }}>
                    {locationLabel(row)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--admin-subtle)" }}>ISP</dt>
                  <dd className="min-w-0 text-right break-words" style={{ color: "var(--admin-text)" }}>
                    {row.isp ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--admin-subtle)" }}>Device</dt>
                  <dd style={{ color: "var(--admin-text)" }}>
                    {row.device_type ?? "—"} · {row.browser ?? "—"} / {row.operating_system ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--admin-subtle)" }}>IP</dt>
                  <dd style={{ color: "var(--admin-text)" }}>{row.ip_address ?? "—"}</dd>
                </div>
              </dl>
            </li>
          ))
        )}
      </ul>

      {/* Desktop: table */}
      <div className="hidden min-w-0 overflow-x-auto rounded-xl border md:block" style={{ borderColor: "var(--admin-border)" }}>
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide" style={{ background: "var(--admin-panel)", color: "var(--admin-muted)" }}>
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">ISP</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Browser / OS</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-red-600 dark:text-red-300">
                  {loadError}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center" style={{ color: "var(--admin-muted)" }}>
                  No login activity recorded yet
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t" style={{ borderColor: "var(--admin-border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--admin-heading)" }}>
                    {row.member_name}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                    {new Date(row.created_at).toLocaleString("en-NG")}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                    {row.city ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                    {row.region ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                    {row.country ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                    {row.isp ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: "var(--admin-muted)" }}>
                    {row.device_type ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-muted)" }}>
                    {row.browser ?? "—"} / {row.operating_system ?? "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-subtle)" }}>
                    {row.ip_address ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
