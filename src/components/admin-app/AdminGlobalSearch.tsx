"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
};

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<number | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void search(query), 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  return (
    <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md lg:max-w-lg">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search members, deposits, withdrawals…"
          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-9 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
          aria-label="Global admin search"
        />
        {query ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && query.trim().length >= 2 ? (
        <>
          <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="Close search" />
          <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-zinc-400">
                <Loader2 size={16} className="animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-400">No results</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {results.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-white/5 px-4 py-3 last:border-0 hover:bg-white/5"
                    >
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-zinc-400">
                        <span className={cn("mr-2 uppercase tracking-wide text-emerald-400")}>{item.type}</span>
                        {item.subtitle}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
