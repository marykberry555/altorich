"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAdminRealtime } from "@/lib/admin-app/useAdminRealtime";
import { AdminNotificationFeedItem } from "@/components/admin-app/AdminNotificationFeedItem";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { AdminNotificationFilter, AdminNotificationItem } from "@/lib/admin-app/notification-events";

const FILTERS: { id: AdminNotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "registrations", label: "Registrations" },
  { id: "logins", label: "Logins" },
  { id: "investments", label: "Investments" },
  { id: "payouts", label: "Payouts" }
];

export function AdminNotificationsPageClient() {
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<AdminNotificationFilter>("all");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (filter !== "all") params.set("filter", filter);
    const res = await fetch(`/api/admin/notifications?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems((data.items ?? []) as AdminNotificationItem[]);
      setUnreadCount(data.unreadCount ?? 0);
    }
  }, [filter]);

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

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Notification center</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Live operations feed · {unreadCount} unread
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="border-white/10 bg-white/5 text-zinc-100" onClick={() => void markAllRead()}>
          Mark all read
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === item.id
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                : "border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-8 text-center text-sm text-zinc-400">
            You&apos;re all caught up — no notifications yet.
          </li>
        ) : (
          items.map((item) => (
            <AdminNotificationFeedItem key={item.id} item={item} onMarkRead={(id) => void markRead(id)} />
          ))
        )}
      </ul>

      <p className="text-center text-xs text-zinc-500">
        Events stream in real time via Supabase ·{" "}
        <Link href={adminAppPath("/activity")} className="text-emerald-400 hover:underline">
          Login activity
        </Link>
      </p>
    </div>
  );
}
