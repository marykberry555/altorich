"use client";

import { useEffect } from "react";
import { clearRuntimeCaches } from "@/lib/cache/chunk-recovery";

/** Remove any legacy service worker and runtime caches that can serve stale Next.js chunks. */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    void clearRuntimeCaches();
  }, []);

  return null;
}
