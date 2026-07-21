"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatFinancialDateTime } from "@/lib/financial-events/format";
import type { CalendarEvent } from "@/lib/financial-events/types";
import { useLiveNow } from "@/lib/hooks/use-live-now";

type Props = {
  events: CalendarEvent[];
  title?: string;
};

const kindLabel: Record<CalendarEvent["kind"], string> = {
  settlement: "Settlement",
  bonus_unlock: "Bonus",
  qualification_end: "Qualification",
  withdrawal_window: "Withdrawals",
  maintenance: "Maintenance",
  announcement: "Announcement",
  portfolio_anniversary: "Anniversary",
  report: "Report"
};

export function FinancialCalendar({ events, title = "Financial calendar" }: Props) {
  const now = useLiveNow();
  const upcoming = events
    .filter((e) => new Date(e.at).getTime() >= now.getTime() - 24 * 60 * 60 * 1000)
    .slice(0, 6);

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-[var(--emerald)]" aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</h2>
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--text-muted)]">No upcoming dates scheduled yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {upcoming.map((event) => {
            const inner = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                    {kindLabel[event.kind]}
                  </span>
                  <time className="text-xs text-[var(--text-muted)]" dateTime={event.at}>
                    {formatFinancialDateTime(event.at)}
                  </time>
                </div>
                <p className="mt-1 font-semibold text-[var(--heading)]">{event.title}</p>
                {event.description ? <p className="mt-0.5 text-xs text-[var(--text-muted)]">{event.description}</p> : null}
              </>
            );

            return (
              <li key={event.id}>
                {event.href ? (
                  <Link
                    href={event.href}
                    className="block rounded-xl border border-[var(--border)] px-4 py-3 transition-colors hover:border-[var(--emerald)]/40 hover:bg-[var(--emerald)]/5"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="rounded-xl border border-[var(--border)] px-4 py-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
