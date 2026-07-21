"use client";

import { useEffect } from "react";
import { clearLegacyRuntimeArtifacts } from "@/lib/cache/chunk-recovery";

/**
 * Boot-time cleanup for known-legacy / stale root SW strategies.
 * Purges at most once per browser (flagged in clearLegacyRuntimeArtifacts).
 * Never nuclear-clear caches on every navigation — that races chunk fetches
 * and surfaces the global error boundary during normal browsing.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    void clearLegacyRuntimeArtifacts().catch(() => {
      /* never block boot */
    });
  }, []);

  return null;
}
