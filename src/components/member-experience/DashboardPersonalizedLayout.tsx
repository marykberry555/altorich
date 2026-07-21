"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  defaultWidgetConfigs,
  isWidgetVisible
} from "@/lib/member-experience/dashboard-preferences";
import type { DashboardWidgetConfig, DashboardWidgetId } from "@/lib/member-experience/types";
import { DashboardCustomizer } from "./DashboardCustomizer";

type WidgetSlot = {
  id: DashboardWidgetId;
  node: ReactNode;
};

type Props = {
  slots: WidgetSlot[];
  headerExtra?: ReactNode;
};

export function DashboardPersonalizedLayout({ slots, headerExtra }: Props) {
  const [configs, setConfigs] = useState<DashboardWidgetConfig[]>(defaultWidgetConfigs());

  const handleChange = useCallback((next: DashboardWidgetConfig[]) => {
    setConfigs(next);
  }, []);

  const orderedVisible = useMemo(() => {
    const byId = new Map(slots.map((s) => [s.id, s.node]));
    const fromPrefs = configs
      .filter((c) => c.visible && byId.has(c.id))
      .map((c) => ({ id: c.id, node: byId.get(c.id)! }));

    const seen = new Set(fromPrefs.map((v) => v.id));
    const remainder = slots
      .filter((s) => !seen.has(s.id) && isWidgetVisible(configs, s.id))
      .map((s) => ({ id: s.id, node: s.node }));

    return [...fromPrefs, ...remainder];
  }, [configs, slots]);

  const showCustomizer = slots.length > 0;

  return (
    <div className="space-y-6 pb-4">
      {showCustomizer ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {headerExtra}
          <DashboardCustomizer onChange={handleChange} />
        </div>
      ) : null}

      {orderedVisible.map(({ id, node }) => (
        <div key={id} data-widget={id}>
          {node}
        </div>
      ))}
    </div>
  );
}
