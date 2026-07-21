"use client";

import { useEffect } from "react";
import { clearLegacyRuntimeArtifacts } from "@/lib/cache/chunk-recovery";

/**
 * Boot-time cleanup for known-legacy / stale root SW strategies.
 * Member site no longer keeps a controlling SW — purge on load so phones
 * stop looping on "Updating Alto Rich" after deploys.
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
