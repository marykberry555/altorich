"use client";

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

/** Compact floating card — premium fintech, no marketing chrome. */
export function LiveActivityCard({
  activity,
  visible,
  reducedMotion,
  onDismiss,
  nowMs,
  className
}: LiveActivityCardProps) {
  const duration = reducedMotion ? 0 : LIVE_ACTIVITY_CONFIG.animationDurationMs;

  return (
    <div
      className={cn(
        "pointer-events-auto w-[min(100%,20.5rem)] rounded-2xl border px-3.5 py-3 backdrop-blur-md",
        "border-emerald-700/20 bg-[color:color-mix(in_srgb,var(--surface-raised)_92%,transparent)]",
        "shadow-[0_10px_28px_rgba(6,78,59,0.12)]",
        "dark:border-emerald-400/20 dark:bg-slate-950/88 dark:shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
        className
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: reducedMotion
          ? "opacity 160ms ease"
          : `opacity ${duration}ms ease, transform ${duration}ms ease`
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800 dark:text-emerald-300">
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400"
              aria-hidden
            />
            Live Activity
          </p>
          <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            {activity.firstName}
          </p>
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{activity.city}</p>
          <p className="mt-1.5 text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
            {activityActionLabel(activity)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {formatRelativeTime(activity.occurredAt, nowMs)}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Dismiss live activity"
        >
          ×
        </button>
      </div>
    </div>
  );
}
