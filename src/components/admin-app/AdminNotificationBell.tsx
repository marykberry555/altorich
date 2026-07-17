"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminRealtime, setAdminAppBadge } from "@/lib/admin-app/useAdminRealtime";
import { AdminNotificationFeedItem } from "@/components/admin-app/AdminNotificationFeedItem";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { AdminNotificationItem } from "@/lib/admin-app/notification-events";

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/notifications?limit=12", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: AdminNotificationItem[]; unreadCount: number };
    setItems(data.items);
    setUnreadCount(data.unreadCount);
    setAdminAppBadge(data.unreadCount);
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

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    await load();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative h-10 w-10 border-white/10 bg-white/5 p-0 text-zinc-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Admin notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="Close notifications" />
          <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">Live feed</p>
              <div className="flex items-center gap-3">
                <Link href={adminAppPath("/notifications")} className="text-xs text-emerald-400 hover:underline" onClick={() => setOpen(false)}>
                  View all
                </Link>
                <button type="button" className="text-xs text-emerald-400 hover:underline" onClick={() => void markAllRead()}>
                  Mark all read
                </button>
              </div>
            </div>
            <ul className="max-h-[28rem] overflow-y-auto p-2 space-y-2">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-zinc-400">
                  You&apos;re all caught up — no notifications yet.
                </li>
              ) : (
                items.map((item) => (
                  <AdminNotificationFeedItem key={item.id} item={item} compact onMarkRead={(id) => void markRead(id)} />
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
