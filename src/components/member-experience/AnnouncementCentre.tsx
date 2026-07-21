"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  ANNOUNCEMENT_CATEGORY_LABELS,
  ANNOUNCEMENT_READ_KEY,
  sortAnnouncements
} from "@/lib/member-experience/announcements";
import type { AnnouncementCategory, PlatformAnnouncement } from "@/lib/member-experience/types";
import { cn } from "@/lib/utils";

type Props = {
  announcements: PlatformAnnouncement[];
  compact?: boolean;
  className?: string;
};

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(ANNOUNCEMENT_READ_KEY, JSON.stringify([...ids]));
  } catch {
    /* graceful degrade */
  }
}

const categoryTone: Record<AnnouncementCategory, string> = {
  feature: "bg-[var(--emerald)]/10 text-[var(--emerald)]",
  maintenance: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  policy: "bg-[var(--navy)]/10 text-[var(--navy)] dark:text-[var(--sidebar-text)]",
  education: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  notice: "bg-red-500/10 text-red-700 dark:text-red-300"
};

export function AnnouncementCentre({ announcements, compact, className }: Props) {
  const sorted = useMemo(() => sortAnnouncements(announcements), [announcements]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setReadIds(loadReadIds());
  }, []);

  const unreadCount = sorted.filter((a) => !readIds.has(a.id)).length;
  const display = compact ? sorted.slice(0, 3) : sorted;

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev).add(id);
      saveReadIds(next);
      return next;
    });
  };

  return (
    <Card variant="elevated" padding="md" className={className}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[var(--emerald)]" aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Announcements
          </h2>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-[var(--emerald)] px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadCount} new
            </span>
          ) : null}
        </div>
        {compact ? (
          <Link href="/announcements" className="text-xs font-medium text-[var(--emerald)] hover:underline">
            View all
          </Link>
        ) : null}
      </div>

      <ul className="mt-4 space-y-3" aria-label="Platform announcements">
        {display.map((item) => {
          const unread = !readIds.has(item.id);
          const inner = (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    categoryTone[item.category]
                  )}
                >
                  {ANNOUNCEMENT_CATEGORY_LABELS[item.category]}
                </span>
                <time className="text-xs text-[var(--text-muted)]" dateTime={item.publishedAt}>
                  {new Date(item.publishedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                </time>
                {unread ? (
                  <span className="size-2 rounded-full bg-[var(--emerald)]" aria-label="Unread" />
                ) : (
                  <CheckCircle2 size={12} className="text-[var(--text-subtle)]" aria-label="Read" />
                )}
              </div>
              <p className="mt-2 font-semibold text-[var(--heading)]">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{item.body}</p>
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => markRead(item.id)}
                  className={cn(
                    "block rounded-xl border px-4 py-3 transition hover:border-[var(--emerald)]/40 hover:bg-[var(--emerald)]/5",
                    unread ? "border-[var(--emerald)]/20 bg-[var(--emerald)]/5" : "border-[var(--border)]"
                  )}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left transition hover:bg-[var(--gray-50)]/80",
                    unread ? "border-[var(--emerald)]/20 bg-[var(--emerald)]/5" : "border-[var(--border)]"
                  )}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
