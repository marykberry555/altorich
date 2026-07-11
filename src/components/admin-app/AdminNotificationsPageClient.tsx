"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";

type NotificationItem = {
  id: string;
  event_type: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export function AdminNotificationsPageClient() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/notifications?limit=100", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminRealtime(() => void load(), ["admin_notifications"]);

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-2 text-sm text-zinc-400">Operational events across the platform.</p>
        </div>
        <Button type="button" size="sm" variant="outline" className="border-white/10 bg-white/5 text-zinc-100" onClick={() => void markAllRead()}>
          Mark all read
        </Button>
      </header>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-8 text-center text-sm text-zinc-400">No notifications yet</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.body}</p>
                </div>
                {!item.read_at ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                    New
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                {item.event_type} · {new Date(item.created_at).toLocaleString("en-NG")}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
