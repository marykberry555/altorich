"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type AdminRealtimeTables = "admin_notifications" | "login_activity";

/** Subscribe to Supabase Realtime for admin ops — replaces polling where available. */
export function useAdminRealtime(onChange: () => void, tables: AdminRealtimeTables[] = ["admin_notifications", "login_activity"]) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const channel = supabase.channel("admin-ops-realtime");

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onChangeRef.current()
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tables.join(",")]);
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
