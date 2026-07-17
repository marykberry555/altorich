"use client";

import { useEffect } from "react";
import {
  recoverFromChunkFailure,
  stripCacheBustParam,
  syncStoredBuildId
} from "@/lib/cache/chunk-recovery";

type Props = {
  buildId: string;
};

export function ChunkLoadRecovery({ buildId }: Props) {
  useEffect(() => {
    stripCacheBustParam();
    syncStoredBuildId(buildId);

    const onError = (event: ErrorEvent) => {
      const message = event.message || String(event.error ?? "");
      void recoverFromChunkFailure(message);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
      void recoverFromChunkFailure(reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [buildId]);

  return null;
}
