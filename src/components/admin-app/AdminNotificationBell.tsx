"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminRealtime, setAdminAppBadge } from "@/lib/admin-app/useAdminRealtime";
import { AdminNotificationFeedItem } from "@/components/admin-app/AdminNotificationFeedItem";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { AdminNotificationItem } from "@/lib/admin-app/notification-events";
import { cn } from "@/lib/utils";

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=12", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: AdminNotificationItem[]; unreadCount: number };
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnreadCount(Number(data.unreadCount) || 0);
      setAdminAppBadge(Number(data.unreadCount) || 0);
    } catch {
      // Non-fatal — keep last known feed.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminRealtime(() => void load(), ["admin_notifications"]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

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
        className="admin-touch relative h-11 w-11 p-0"
        style={{ borderColor: "var(--admin-border)", background: "var(--admin-hover)", color: "var(--admin-text)" }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Admin notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--admin-emerald)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            style={{ background: "var(--admin-overlay)" }}
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className={cn(
              "fixed z-50 flex flex-col shadow-2xl",
              /* Mobile: full-viewport slide-over */
              "inset-0 w-full",
              "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
              /* Desktop: anchored panel */
              "md:inset-auto md:right-4 md:top-16 md:h-auto md:max-h-[min(32rem,calc(100dvh-5rem))] md:w-[min(24rem,calc(100vw-2rem))] md:rounded-xl md:border md:pt-0 md:pb-0"
            )}
            style={{
              background: "var(--admin-panel)",
              borderColor: "var(--admin-border)",
              color: "var(--admin-text)"
            }}
          >
            <header
              className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
              style={{
                background: "var(--admin-panel)",
                borderColor: "var(--admin-border)",
                paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))"
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--admin-heading)" }}>
                  Notifications
                </p>
                {unreadCount > 0 ? (
                  <p className="text-xs" style={{ color: "var(--admin-muted)" }}>
                    {unreadCount} unread
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="admin-touch inline-flex items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
                  style={{ color: "var(--admin-emerald-text)" }}
                  onClick={() => void markAllRead()}
                >
                  <CheckCheck size={14} aria-hidden />
                  Mark all read
                </button>
                <button
                  type="button"
                  className="admin-touch inline-flex items-center justify-center rounded-lg"
                  style={{ color: "var(--admin-text)" }}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 md:max-h-[24rem]">
              {items.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm" style={{ color: "var(--admin-muted)" }}>
                  You&apos;re all caught up — no notifications yet.
                </li>
              ) : (
                items.map((item) => (
                  <AdminNotificationFeedItem key={item.id} item={item} compact onMarkRead={(id) => void markRead(id)} />
                ))
              )}
            </ul>

            <footer
              className="sticky bottom-0 shrink-0 border-t px-4 py-3"
              style={{
                background: "var(--admin-panel)",
                borderColor: "var(--admin-border)",
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))"
              }}
            >
              <Link
                href={adminAppPath("/notifications")}
                className="flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold"
                style={{ background: "var(--admin-emerald-soft)", color: "var(--admin-emerald-text)" }}
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </footer>
          </div>
        </>
      ) : null}
    </div>
  );
}
