"use client";

import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { formatFinancialDateTime } from "@/lib/financial-events/format";
import {
  NOTIFICATION_CATEGORY_LABELS,
  categorizeNotification
} from "@/lib/financial-events/notification-category";
import type { NotificationCategory } from "@/lib/financial-events/types";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

type Props = {
  notifications: NotificationRow[];
};

const TABS: NotificationCategory[] = [
  "all",
  "deposits",
  "withdrawals",
  "investment",
  "bonus",
  "referral",
  "security",
  "announcements"
];

export function NotificationCenter({ notifications }: Props) {
  const [active, setActive] = useState<NotificationCategory>("all");

  const enriched = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        category: categorizeNotification({
          title: n.title,
          body: n.body,
          metadata: (n.metadata ?? null) as never
        }) as Exclude<NotificationCategory, "all">
      })),
    [notifications]
  );

  const filtered = active === "all" ? enriched : enriched.filter((n) => n.category === active);
  const unreadCount = enriched.filter((n) => !n.read_at).length;

  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="We'll keep you informed whenever something important happens — deposits, settlements, withdrawals, and account updates."
      />
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--heading)]">{unreadCount}</span> unread
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Notification categories">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              active === tab
                ? "border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]"
                : "border-[var(--border)] text-[var(--text-muted)]"
            )}
            onClick={() => setActive(tab)}
          >
            {tab === "all" ? "All" : NOTIFICATION_CATEGORY_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-muted)]">No notifications in this category.</p>
        ) : (
          filtered.map((n) => (
            <Card key={n.id} variant="elevated" className={cn(!n.read_at && "ring-1 ring-[var(--gold)]/30")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--heading)]">{n.title}</p>
                    <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--text-subtle)]">
                      {NOTIFICATION_CATEGORY_LABELS[n.category]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{n.body}</p>
                  <time className="mt-2 block text-xs text-[var(--text-subtle)]" dateTime={n.created_at}>
                    {formatFinancialDateTime(n.created_at)}
                  </time>
                </div>
                {!n.read_at ? <Badge variant="gold">New</Badge> : null}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
