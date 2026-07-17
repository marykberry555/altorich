"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";
import { activityActionLabel, formatRelativeTime } from "@/lib/social/live-activity-format";
import type { LiveActivity } from "@/lib/social/live-activity-types";

type LiveActivityCardProps = {
  activity: LiveActivity;
  visible: boolean;
  reducedMotion: boolean;
  onDismiss: () => void;
  nowMs: number;
  className?: string;
};

/** Premium fintech Live Activity notification — high theme contrast, subtle motion. */
export function LiveActivityCard({
  activity,
  visible,
  reducedMotion,
  onDismiss,
  nowMs,
  className
}: LiveActivityCardProps) {
  const duration = reducedMotion ? 0 : LIVE_ACTIVITY_CONFIG.animationDurationMs;
  const personLine = `${activity.firstName} from ${activity.locationLabel}`;
  const actionLine = activityActionLabel(activity);
  const timeLine = formatRelativeTime(activity.occurredAt, nowMs);

  return (
    <div
      className={cn(
        "pointer-events-auto w-[min(90vw,21.5rem)] rounded-[var(--radius)] border px-4 py-4 sm:w-[min(90vw,22.5rem)]",
        "border-[var(--border-float)] bg-[var(--surface-float)] shadow-[var(--shadow-float)]",
        className
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: reducedMotion
          ? "opacity 160ms ease"
          : `opacity ${duration}ms var(--ease-out), transform ${duration}ms var(--ease-out)`
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${personLine}. ${actionLine}. ${timeLine}.`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--emerald-light)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--emerald-light)_28%,transparent)]"
              aria-hidden
            />
            Live Activity
          </p>
          <p className="text-[1.0625rem] font-bold leading-snug tracking-tight text-[var(--text-float)] sm:text-lg">
            {personLine}
          </p>
          <p className="text-sm font-medium leading-snug text-[var(--text-float-secondary)]">
            {actionLine}
          </p>
          <p className="text-xs font-medium leading-none text-[var(--text-float-muted)]">{timeLine}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
            "-mr-1.5 -mt-1.5 text-[var(--text-float-muted)]",
            "transition-colors hover:bg-[color-mix(in_srgb,var(--text-float)_8%,transparent)] hover:text-[var(--text-float)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-float)]"
          )}
          aria-label="Dismiss live activity"
        >
          <X className="size-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </div>
  );
}
