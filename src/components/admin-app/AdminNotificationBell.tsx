"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  event_type: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/notifications?limit=20", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: NotificationItem[]; unreadCount: number };
    setItems(data.items);
    setUnreadCount(data.unreadCount);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
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
          <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <button type="button" className="text-xs text-emerald-400 hover:underline" onClick={() => void markAllRead()}>
                Mark all read
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-zinc-400">No notifications yet</li>
              ) : (
                items.map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "border-b border-white/5 px-4 py-3 last:border-0",
                      !item.read_at && "bg-emerald-500/5"
                    )}
                  >
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{item.body}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
                      {new Date(item.created_at).toLocaleString("en-NG")}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
