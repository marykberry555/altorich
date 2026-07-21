"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DashboardWidgetConfig } from "@/lib/member-experience/types";
import {
  DASHBOARD_PREFS_KEY,
  defaultWidgetConfigs,
  mergeWidgetConfigs
} from "@/lib/member-experience/dashboard-preferences";
import { cn } from "@/lib/utils";

type Props = {
  onChange: (configs: DashboardWidgetConfig[]) => void;
  className?: string;
};

export function DashboardCustomizer({ onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState<DashboardWidgetConfig[]>(defaultWidgetConfigs());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_PREFS_KEY);
      const parsed = raw ? (JSON.parse(raw) as DashboardWidgetConfig[]) : null;
      const merged = mergeWidgetConfigs(parsed);
      setConfigs(merged);
      onChange(merged);
    } catch {
      onChange(defaultWidgetConfigs());
    }
  }, [onChange]);

  const persist = useCallback(
    (next: DashboardWidgetConfig[]) => {
      setConfigs(next);
      onChange(next);
      try {
        localStorage.setItem(DASHBOARD_PREFS_KEY, JSON.stringify(next));
      } catch {
        /* graceful degrade */
      }
    },
    [onChange]
  );

  const toggleVisible = (id: DashboardWidgetConfig["id"]) => {
    persist(configs.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...configs];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };

  const reset = () => persist(defaultWidgetConfigs());

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="dashboard-customizer-panel"
      >
        <LayoutGrid size={14} aria-hidden />
        Customise
      </Button>

      {open ? (
        <div
          id="dashboard-customizer-panel"
          className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,320px)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-lg)]"
          role="dialog"
          aria-label="Dashboard customisation"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--heading)]">Dashboard widgets</p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--heading)]"
            >
              <RotateCcw size={12} aria-hidden />
              Reset
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Show, hide, or reorder sections.</p>

          <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {configs.map((widget, index) => (
              <li
                key={widget.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-2 py-1.5"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={widget.visible}
                    onChange={() => toggleVisible(widget.id)}
                    className="size-4 rounded border-[var(--border)] text-[var(--emerald)] focus:ring-[var(--emerald)]"
                  />
                  <span className="truncate text-[var(--heading)]">{widget.label}</span>
                </label>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--gray-100)] disabled:opacity-30"
                    aria-label={`Move ${widget.label} up`}
                  >
                    <ChevronUp size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={index === configs.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--gray-100)] disabled:opacity-30"
                    aria-label={`Move ${widget.label} down`}
                  >
                    <ChevronDown size={14} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
