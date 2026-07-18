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
      className={cn("w-full min-w-0 rounded-xl border border-l-4", styles.accent)}
      style={{
        background: "var(--admin-surface-card, var(--admin-panel-elevated))",
        borderColor: "var(--admin-border)"
      }}
    >
      <div className={cn("px-4", compact ? "py-3" : "py-4")}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium" style={{ color: "var(--admin-heading)" }}>
                {item.title}
              </p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  styles.badge
                )}
              >
                {styles.label}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-sm" style={{ color: "var(--admin-muted)" }}>
              {lines.map((line) => (
                <p key={line} className="break-words">
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-wide" style={{ color: "var(--admin-subtle)" }}>
              {formatNotificationTime(item.created_at)}
            </p>
          </div>
          {!item.read_at ? (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: "var(--admin-emerald-soft)", color: "var(--admin-emerald-text)" }}
            >
              Unread
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href={action?.href ?? href}
            className={cn(
              "inline-flex h-10 min-h-[44px] items-center justify-center rounded-lg px-3 text-xs font-medium transition sm:min-h-0 sm:h-8"
            )}
            style={
              priority === "high"
                ? { background: "var(--admin-emerald)", color: "#fff" }
                : {
                    border: "1px solid var(--admin-border)",
                    background: "var(--admin-hover)",
                    color: "var(--admin-text)"
                  }
            }
          >
            {action?.label ?? "Open"}
          </Link>
          {!item.read_at && onMarkRead ? (
            <button
              type="button"
              className="inline-flex h-10 min-h-[44px] items-center px-2 text-xs font-semibold sm:h-auto sm:min-h-0"
              style={{ color: "var(--admin-emerald-text)" }}
              onClick={() => onMarkRead(item.id)}
            >
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
