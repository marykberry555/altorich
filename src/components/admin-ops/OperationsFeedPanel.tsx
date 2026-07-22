"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Radio, Search } from "lucide-react";
import { adminAppPath } from "@/lib/admin-app/constants";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";
import type { OperationsFeedCategory, OperationsFeedEvent } from "@/lib/admin-ops/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: OperationsFeedCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deposits", label: "Deposits" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "members", label: "Members" },
  { id: "support", label: "Support" },
  { id: "security", label: "Security" },
  { id: "system", label: "System" }
];

type Props = {
  compact?: boolean;
  limit?: number;
  className?: string;
};

export function OperationsFeedPanel({ compact, limit = 50, className }: Props) {
  const [events, setEvents] = useState<OperationsFeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState<OperationsFeedCategory>("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (category !== "all") params.set("category", category);
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/operations-feed?${params}`, {
        cache: "no-store",
        credentials: "same-origin"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not load operations feed.");
      }
      setEvents(data.events ?? []);
    } catch (err) {
      setEvents([]);
      setLoadError(err instanceof Error ? err.message : "Could not load operations feed.");
    } finally {
      setLoading(false);
    }
  }, [category, limit, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminRealtime(() => void load());

  const display = useMemo(() => events, [events]);

  return (
    <section
      className={cn("rounded-2xl border border-white/10 bg-zinc-900/80", compact ? "p-4" : "p-5", className)}
      aria-label="Operations feed"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-emerald-400" aria-hidden />
          <h2 className="text-sm font-semibold text-white">Live operations feed</h2>
        </div>
        {!compact ? (
          <Link href={adminAppPath("/operations")} className="text-xs text-emerald-400 hover:underline">
            Full feed
          </Link>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCategory(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                category === f.id ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      {!compact ? (
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search feed…"
            className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500"
            aria-label="Search operations feed"
          />
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 size={14} className="animate-spin" /> Loading feed…
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {loadError ? (
            <li className="text-sm text-red-300">{loadError}</li>
          ) : display.length === 0 ? (
            <li className="text-sm text-zinc-400">No operational events match your filters.</li>
          ) : (
            display.map((event) => {
              const inner = (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {event.category}
                    </span>
                    <time className="text-[10px] text-zinc-500" dateTime={event.at}>
                      {new Date(event.at).toLocaleString("en-NG")}
                    </time>
                  </div>
                  <p className="mt-1 text-sm font-medium text-white">{event.title}</p>
                  {event.description ? <p className="mt-0.5 text-xs text-zinc-400">{event.description}</p> : null}
                </>
              );

              return (
                <li key={event.id}>
                  {event.href ? (
                    <Link href={event.href} className="block rounded-lg border border-white/5 px-3 py-2 transition hover:bg-white/5">
                      {inner}
                    </Link>
                  ) : (
                    <div className="rounded-lg border border-white/5 px-3 py-2">{inner}</div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </section>
  );
}
