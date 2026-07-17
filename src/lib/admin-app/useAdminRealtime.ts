"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { pushEligibleEventTypes } from "@/lib/admin-app/notification-events";

export type AdminRealtimeTables = "admin_notifications" | "login_activity";

const deliveredPushIds = new Set<string>();

async function deliverPushForNotification(id: string) {
  if (deliveredPushIds.has(id)) return;
  deliveredPushIds.add(id);
  try {
    await fetch("/api/admin/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
  } catch {
    deliveredPushIds.delete(id);
  }
}

/** Subscribe to Supabase Realtime for admin ops — replaces polling where available. */
export function useAdminRealtime(onChange: () => void, tables: AdminRealtimeTables[] = ["admin_notifications", "login_activity"]) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const tablesKey = useMemo(() => tables.join(","), [tables]);
  const tableList = useMemo(
    () => tablesKey.split(",").filter(Boolean) as AdminRealtimeTables[],
    [tablesKey]
  );

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase.channel("admin-ops-realtime");

    if (tableList.includes("admin_notifications")) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          onChangeRef.current();
          const row = payload.new as { id?: string; event_type?: string; title?: string; body?: string };
          if (row.id && row.event_type && (pushEligibleEventTypes() as readonly string[]).includes(row.event_type)) {
            void deliverPushForNotification(row.id);
          }
          if ("serviceWorker" in navigator && row.title) {
            navigator.serviceWorker.ready
              .then((reg) =>
                reg.active?.postMessage({
                  type: "SHOW_NOTIFICATION",
                  payload: { title: row.title, body: row.body, url: "/admin-app/notifications" }
                })
              )
              .catch(() => undefined);
          }
        }
      );
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_notifications" },
        () => onChangeRef.current()
      );
    }

    for (const table of tableList.filter((t) => t !== "admin_notifications")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => onChangeRef.current());
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tableList]);
}

/** Update PWA app badge from unread notification count (where supported). */
export function setAdminAppBadge(count: number) {
  if (!("setAppBadge" in navigator)) return;
  if (count > 0) {
    void navigator.setAppBadge(count).catch(() => undefined);
  } else {
    void navigator.clearAppBadge?.().catch(() => undefined);
  }
}
