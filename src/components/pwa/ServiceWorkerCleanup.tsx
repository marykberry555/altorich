"use client";

import { useEffect } from "react";

/** Incident hotfix — unregister stale service workers that serve mismatched Next.js chunks. */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void (async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith("altorich-")).map((key) => caches.delete(key)));
        }

        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } catch {
        // Never block the app if cleanup fails
      }
    })();
  }, []);

  return null;
}
