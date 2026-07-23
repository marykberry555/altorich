"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Actor = { id: string; full_name: string };

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminAuditPageClient() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState("");
  const [settlementReference, setSettlementReference] = useState("");
  const [actorId, setActorId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200", includeActors: "1" });
    if (memberId.trim()) params.set("memberId", memberId.trim());
    if (settlementReference.trim()) params.set("settlementReference", settlementReference.trim());
    if (actorId) params.set("actorId", actorId);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    if (q.trim()) params.set("q", q.trim());

    const res = await fetch(`/api/admin/audit-logs?${params}`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { logs: AuditRow[]; actors: Actor[] } | AuditRow[];
      if (Array.isArray(json)) {
        setRows(json);
      } else {
        setRows(json.logs ?? []);
        setActors(json.actors ?? []);
      }
    }
    setLoading(false);
  }, [memberId, settlementReference, actorId, from, to, q]);

  useEffect(() => {
    void load();
  }, [load]);

  function presetToday() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    setFrom(toLocalInputValue(start));
    setTo(toLocalInputValue(now));
  }

  return (
    <div className="min-w-0 space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--admin-emerald-text)" }}>
          Monitoring
        </p>
        <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--admin-heading)" }}>
          Audit trail
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--admin-muted)" }}>
          Filter by member, settlement reference, admin actor, or date range.
        </p>
      </header>

      <form
        className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3"
        style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)" }}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          Member ID
          <input
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="Profile UUID"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          />
        </label>
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          Settlement reference
          <input
            value={settlementReference}
            onChange={(e) => setSettlementReference(e.target.value)}
            placeholder="ALT-20260718-000001"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          />
        </label>
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          Admin actor
          <select
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          >
            <option value="">Any admin</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          From
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          />
        </label>
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          To
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          />
        </label>
        <label className="block text-xs" style={{ color: "var(--admin-subtle)" }}>
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Action, entity, metadata…"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)", color: "var(--admin-text)" }}
          />
        </label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Apply filters
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              presetToday();
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setMemberId("");
              setSettlementReference("");
              setActorId("");
              setFrom("");
              setTo("");
              setQ("");
              setLoading(true);
              void fetch("/api/admin/audit-logs?limit=200&includeActors=1", { cache: "no-store" })
                .then(async (res) => {
                  if (!res.ok) return;
                  const json = (await res.json()) as { logs: AuditRow[]; actors: Actor[] } | AuditRow[];
                  if (Array.isArray(json)) setRows(json);
                  else {
                    setRows(json.logs ?? []);
                    setActors(json.actors ?? []);
                  }
                })
                .finally(() => setLoading(false));
            }}
          >
            Clear
          </Button>
        </div>
      </form>

      <p className="text-xs" style={{ color: "var(--admin-subtle)" }}>
        {loading ? "Loading…" : `${rows.length} entr${rows.length === 1 ? "y" : "ies"}`}
      </p>

      <ul className="space-y-3 md:hidden">
        {rows.length === 0 && !loading ? (
          <li
            className="rounded-xl border px-4 py-8 text-center text-sm"
            style={{ borderColor: "var(--admin-border)", color: "var(--admin-muted)" }}
          >
            No matching audit entries
          </li>
        ) : (
          rows.map((log) => (
            <li
              key={log.id}
              className="min-w-0 rounded-xl border p-4"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-panel)" }}
            >
              <p className="break-all font-mono text-xs" style={{ color: "var(--admin-heading)" }}>
                {log.action}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--admin-muted)" }}>
                {log.entity_type}
                {log.entity_id ? ` · ${String(log.entity_id).slice(0, 8)}` : ""}
              </p>
              {log.reference ? (
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--admin-emerald-text)" }}>
                  {log.reference}
                </p>
              ) : null}
              <p className="mt-2 text-xs" style={{ color: "var(--admin-subtle)" }}>
                {log.actor_name ?? "System"} · {new Date(log.created_at).toLocaleString("en-NG")}
              </p>
            </li>
          ))
        )}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border md:block" style={{ borderColor: "var(--admin-border)" }}>
        <table className="min-w-full text-left text-sm">
          <thead style={{ background: "var(--admin-panel)", color: "var(--admin-subtle)" }}>
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Entity</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 font-medium">Admin</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center" style={{ color: "var(--admin-muted)" }}>
                  No matching audit entries
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr key={log.id} className="border-t" style={{ borderColor: "var(--admin-border)" }}>
                  <td className="whitespace-nowrap px-3 py-2" style={{ color: "var(--admin-muted)" }}>
                    {new Date(log.created_at).toLocaleString("en-NG")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--admin-heading)" }}>
                    {log.action}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--admin-muted)" }}>
                    {log.entity_type}
                    {log.entity_id ? ` · ${String(log.entity_id).slice(0, 8)}` : ""}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--admin-emerald-text)" }}>
                    {log.reference ?? "—"}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--admin-text)" }}>
                    {log.actor_name ?? "System"}
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
