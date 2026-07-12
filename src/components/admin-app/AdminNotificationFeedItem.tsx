"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  formatNotificationTime,
  notificationAction,
  notificationHref,
  notificationPriority,
  priorityStyles,
  type AdminNotificationItem
} from "@/lib/admin-app/notification-events";

type Props = {
  item: AdminNotificationItem;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
};

export function AdminNotificationFeedItem({ item, compact = false, onMarkRead }: Props) {
  const priority = notificationPriority(item);
  const styles = priorityStyles(priority);
  const action = notificationAction(item);
  const href = notificationHref(item);
  const lines = item.body.split("\n").filter(Boolean);

  return (
    <li
      className={cn(
        "rounded-xl border border-white/10 bg-zinc-900/80 border-l-4",
        styles.accent,
        !item.read_at && "ring-1 ring-emerald-500/20"
      )}
    >
      <div className={cn("px-4", compact ? "py-3" : "py-4")}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-white">{item.title}</p>
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", styles.badge)}>
                {styles.label}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-sm text-zinc-300">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">{formatNotificationTime(item.created_at)}</p>
          </div>
          {!item.read_at ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              Unread
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href={action?.href ?? href}
            className={cn(
              "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium transition",
              priority === "high"
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "border border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10"
            )}
          >
            {action?.label ?? "Open"}
          </Link>
          {!item.read_at && onMarkRead ? (
            <button type="button" className="text-xs text-emerald-400 hover:underline" onClick={() => onMarkRead(item.id)}>
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
