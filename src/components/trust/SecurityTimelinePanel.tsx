"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { formatFinancialDateTime } from "@/lib/financial-events/format";
import { categoryLabel, statusLabel } from "@/lib/trust/activity-labels";
import { filterTimelineEvents } from "@/lib/trust/security-timeline";
import type { SecurityTimelineCategory, SecurityTimelineEvent } from "@/lib/trust/types";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ id: SecurityTimelineCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "authentication", label: "Authentication" },
  { id: "profile", label: "Profile" },
  { id: "investment", label: "Investment" },
  { id: "withdrawal", label: "Withdrawal" },
  { id: "admin", label: "Admin" },
  { id: "notice", label: "Notices" }
];

type Props = {
  events: SecurityTimelineEvent[];
  exportHref?: string;
  compact?: boolean;
};

const STATUS_STYLES: Record<SecurityTimelineEvent["status"], string> = {
  success: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10",
  failed: "text-red-700 dark:text-red-300 bg-red-500/10",
  info: "text-[var(--text-muted)] bg-[var(--gray-100)]",
  warning: "text-amber-800 dark:text-amber-200 bg-amber-500/10"
};

export function SecurityTimelinePanel({ events, exportHref, compact = false }: Props) {
  const [category, setCategory] = useState<SecurityTimelineCategory | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterTimelineEvents(events, { category, query }),
    [events, category, query]
  );

  return (
    <Card variant="elevated" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            Account activity timeline
          </h2>
          {!compact ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Authentication, profile changes, investments, withdrawals, and notices in one place.
            </p>
          ) : null}
        </div>
        {exportHref ? (
          <a
            href={exportHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--emerald)] hover:underline"
          >
            <Download size={14} aria-hidden />
            Export transactions
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" aria-hidden />
          <Input
            type="search"
            placeholder="Search activity…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search account activity"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            onClick={() => setCategory(item.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              category === item.id
                ? "border-[var(--emerald)] bg-[var(--emerald)]/10 text-[var(--emerald)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--emerald)]/40"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No matching activity"
            description={
              events.length === 0
                ? "Activity will appear here as you use your account."
                : "Try a different filter or search term."
            }
          />
        </div>
      ) : (
        <ol className="mt-4 space-y-3" aria-label="Account activity timeline">
          {filtered.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-[var(--border)] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--heading)]">{event.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-subtle)]">{categoryLabel(event.category)}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_STYLES[event.status])}>
                  {statusLabel(event.status)}
                </span>
              </div>
              {event.description ? (
                <p className="mt-2 text-sm text-[var(--text-muted)]">{event.description}</p>
              ) : null}
              <dl className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--text-subtle)]">When</dt>
                  <dd>
                    <time dateTime={event.timestamp}>{formatFinancialDateTime(event.timestamp)}</time>
                  </dd>
                </div>
                {event.browser ? (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Browser</dt>
                    <dd>{event.browser}</dd>
                  </div>
                ) : null}
                {event.device ? (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Device</dt>
                    <dd>{event.device}</dd>
                  </div>
                ) : null}
                {event.location ? (
                  <div>
                    <dt className="text-[var(--text-subtle)]">Location</dt>
                    <dd>{event.location}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
