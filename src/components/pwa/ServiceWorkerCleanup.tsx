"use client";

import { useEffect } from "react";
import { clearLegacyRuntimeArtifacts } from "@/lib/cache/chunk-recovery";

/**
 * Boot-time cleanup for known-legacy SW/cache strategies.
 * Intentionally does NOT unregister current service workers on every load —
 * that raced AdminAppPwaProvider / member SW registration and produced
 * intermittent ChunkLoadError → "Connection problem" screens.
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
