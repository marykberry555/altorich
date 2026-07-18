"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { pushEligibleEventTypes } from "@/lib/admin-app/notification-events";

export type AdminRealtimeTables = "admin_notifications" | "login_activity";

type RealtimeSubscriber = {
  tables: AdminRealtimeTables[];
  onChange: () => void;
};

const CHANNEL_TOPIC = "admin-ops-realtime";
const subscribers = new Set<RealtimeSubscriber>();
const deliveredPushIds = new Set<string>();

let sharedClient: SupabaseClient | null = null;
let sharedChannel: RealtimeChannel | null = null;
let channelReady = false;
let channelStarting = false;
let pollTimer: number | null = null;

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

function notifySubscribers(table: AdminRealtimeTables) {
  for (const subscriber of subscribers) {
    if (subscriber.tables.includes(table)) {
      try {
        subscriber.onChange();
      } catch {
        // Never let a listener crash the shared channel.
      }
    }
  }
}

function handleNotificationInsert(payload: { new?: Record<string, unknown> }) {
  notifySubscribers("admin_notifications");
  const row = (payload.new ?? {}) as { id?: string; event_type?: string; title?: string; body?: string };
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

function ensureSharedChannel() {
  if (channelReady || channelStarting) return;
  channelStarting = true;

  try {
    sharedClient = createClient();
  } catch {
    channelStarting = false;
    return;
  }

  // Reuse one channel for the whole admin shell. Multiple hooks must not
  // call .on() after .subscribe() on the same topic — that throws and takes
  // down every admin page that mounts the header bell + page realtime.
  sharedChannel = sharedClient.channel(CHANNEL_TOPIC);
  sharedChannel
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "admin_notifications" },
      (payload) => handleNotificationInsert(payload as { new?: Record<string, unknown> })
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "admin_notifications" },
      () => notifySubscribers("admin_notifications")
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "login_activity" },
      () => notifySubscribers("login_activity")
    )
    .subscribe();

  channelReady = true;
  channelStarting = false;

  if (pollTimer == null) {
    pollTimer = window.setInterval(() => {
      for (const subscriber of subscribers) {
        try {
          subscriber.onChange();
        } catch {
          /* ignore */
        }
      }
    }, 20_000);
  }
}

function releaseSharedChannelIfIdle() {
  if (subscribers.size > 0) return;
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  if (sharedClient && sharedChannel) {
    void sharedClient.removeChannel(sharedChannel);
  }
  sharedChannel = null;
  sharedClient = null;
  channelReady = false;
  channelStarting = false;
}

/**
 * Subscribe to Supabase Realtime for admin ops.
 * Safe to call from multiple components (bell + dashboard + pages).
 */
export function useAdminRealtime(
  onChange: () => void,
  tables: AdminRealtimeTables[] = ["admin_notifications", "login_activity"]
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const tablesKey = useMemo(() => [...tables].sort().join(","), [tables]);

  useEffect(() => {
    const tableList = tablesKey.split(",").filter(Boolean) as AdminRealtimeTables[];
    const subscriber: RealtimeSubscriber = {
      tables: tableList,
      onChange: () => onChangeRef.current()
    };

    subscribers.add(subscriber);
    ensureSharedChannel();

    return () => {
      subscribers.delete(subscriber);
      releaseSharedChannelIfIdle();
    };
  }, [tablesKey]);
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
