"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type ErrorRow = {
  id: string;
  reference_id: string;
  category: string;
  status: "open" | "investigating" | "resolved" | "ignored";
  message: string;
  user_message: string | null;
  code: string | null;
  user_id: string | null;
  user_label: string;
  route: string | null;
  action: string | null;
  stack: string | null;
  browser: string | null;
  device: string | null;
  environment: string | null;
  created_at: string;
  resolved_at: string | null;
};

export function AdminErrorsClient() {
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("open");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        status,
        category,
        limit: "100"
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/errors?${params}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Unable to load errors.");
      setRows(body.rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load errors.");
    } finally {
      setLoading(false);
    }
  }, [status, category, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  async function updateStatus(id: string, next: ErrorRow["status"]) {
    const res = await fetch("/api/admin/errors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next })
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Unable to update status.");
      return;
    }
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: next } : row)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-zinc-400">
          Status
          <select
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-zinc-400">
          Category
          <select
            className="rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All</option>
            <option value="server">Server</option>
            <option value="network">Network</option>
            <option value="authentication">Authentication</option>
            <option value="validation">Validation</option>
            <option value="business">Business</option>
            <option value="not_found">Not found</option>
          </select>
        </label>
        <div className="min-w-[220px] flex-1">
          <Input
            label="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Reference, message, route…"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card variant="elevated" padding="none" className="overflow-hidden border-white/10 bg-zinc-950">
          <div className="max-h-[36rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-900 text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-3 py-2.5">Error ID</th>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Page</th>
                  <th className="px-3 py-2.5">Time</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-zinc-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-zinc-500">
                      No errors match these filters.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        "cursor-pointer border-t border-white/5 hover:bg-white/[0.03]",
                        selectedId === row.id && "bg-emerald-500/10"
                      )}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-emerald-300">{row.reference_id}</td>
                      <td className="px-3 py-2.5 text-zinc-300">{row.user_label}</td>
                      <td className="max-w-[160px] truncate px-3 py-2.5 text-zinc-400">{row.route ?? "—"}</td>
                      <td className="px-3 py-2.5 text-zinc-500">
                        {new Date(row.created_at).toLocaleString("en-NG")}
                      </td>
                      <td className="px-3 py-2.5 capitalize text-zinc-300">{row.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card variant="elevated" padding="md" className="border-white/10 bg-zinc-950">
          {!selected ? (
            <p className="text-sm text-zinc-500">Select an error to inspect stack trace and mark resolved.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="font-mono text-sm text-emerald-300">{selected.reference_id}</p>
                <p className="mt-1 text-sm text-zinc-200">{selected.message}</p>
              </div>
              <dl className="grid gap-2 text-xs text-zinc-400">
                <div className="flex justify-between gap-3">
                  <dt>Category</dt>
                  <dd className="text-zinc-200">{selected.category}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Action</dt>
                  <dd className="text-zinc-200">{selected.action ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Environment</dt>
                  <dd className="text-zinc-200">{selected.environment ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Device</dt>
                  <dd className="max-w-[60%] truncate text-right text-zinc-200">{selected.device ?? "—"}</dd>
                </div>
              </dl>
              {selected.stack ? (
                <pre className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-300">
                  {selected.stack}
                </pre>
              ) : (
                <p className="text-xs text-zinc-500">No stack trace captured.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" size="sm" variant="outline" onClick={() => void updateStatus(selected.id, "investigating")}>
                  Investigating
                </Button>
                <Button type="button" size="sm" onClick={() => void updateStatus(selected.id, "resolved")}>
                  Resolve
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => void updateStatus(selected.id, "ignored")}>
                  Ignore
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
