import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  CircleDot,
  Gift,
  Shield,
  TrendingUp,
  User,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatFinancialDateTime } from "@/lib/financial-events/format";
import type { FinancialEventKind, FinancialTimelineEvent } from "@/lib/financial-events/types";
import { StatusChip } from "./StatusChip";
import { formatNaira } from "@/lib/domain";

type Props = {
  events: FinancialTimelineEvent[];
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  maxItems?: number;
};

function kindIcon(kind: FinancialEventKind) {
  switch (kind) {
    case "deposit":
      return ArrowDownToLine;
    case "withdrawal":
      return ArrowUpFromLine;
    case "investment":
    case "settlement":
      return TrendingUp;
    case "bonus":
      return Gift;
    case "referral":
      return Users;
    case "security":
      return Shield;
    case "announcement":
      return Bell;
    case "account":
      return User;
    default:
      return CircleDot;
  }
}

export function FinancialTimeline({
  events,
  title = "Activity timeline",
  emptyTitle = "No activity yet",
  emptyDescription = "Deposits, investments, and settlements will appear here as they happen.",
  className,
  maxItems
}: Props) {
  const items = maxItems ? events.slice(0, maxItems) : events;

  if (items.length === 0) {
    return (
      <Card variant="elevated" padding="md" className={className}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</p>
        <div className="py-10 text-center" role="status">
          <p className="text-sm font-medium text-[var(--heading)]">{emptyTitle}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{emptyDescription}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="md" className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{title}</p>
      <ol className="relative mt-5 space-y-0" aria-label={title}>
        {items.map((event, index) => {
          const Icon = kindIcon(event.kind);
          return (
            <li
              key={event.id}
              className={cn(
                "relative flex gap-4 pb-6 last:pb-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-1",
                index === 0 && "motion-safe:duration-500"
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {index < items.length - 1 ? (
                <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-[var(--border)]" aria-hidden />
              ) : null}
              <span className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--emerald)] transition-transform hover:scale-105">
                <Icon size={14} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--heading)]">{event.title}</p>
                    {event.description ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">{event.description}</p>
                    ) : null}
                  </div>
                  {event.amount != null && event.amount > 0 ? (
                    <span className="shrink-0 text-sm font-medium tabular-nums text-[var(--text-muted)]">
                      {formatNaira(event.amount)}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <time className="text-xs text-[var(--text-subtle)]" dateTime={event.timestamp}>
                    {formatFinancialDateTime(event.timestamp)}
                  </time>
                  {event.status ? <StatusChip label={event.status} variant="outline" /> : null}
                  {event.reference ? (
                    <span className="font-mono text-[10px] text-[var(--text-subtle)]">{event.reference}</span>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
