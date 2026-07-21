"use client";

import { useEffect, useRef } from "react";
import {
  LONG_BACKGROUND_MS,
  RECOVERY_CHANNEL,
  clearLegacyRuntimeArtifacts,
  markHealthyBoot,
  recoverFromChunkFailure,
  softRefreshIfDeployStale,
  stripCacheBustParam
} from "@/lib/cache/chunk-recovery";

type Props = {
  buildId: string;
};

/**
 * Deploy / PWA / multi-tab stability:
 * - Purge known-legacy SW caches once (never nuclear-clear on every load)
 * - Recover from confirmed chunk misses at most once until healthy boot
 * - Soft-refresh stale bfcache / long-background tabs after a deploy
 * - Coordinate sibling tabs via BroadcastChannel
 * - Do not force-reload merely because build id changed while the user is active
 */
export function ChunkLoadRecovery({ buildId }: Props) {
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    stripCacheBustParam();
    markHealthyBoot(buildId);
    void clearLegacyRuntimeArtifacts().catch(() => {
      /* never block boot */
    });

    const onError = (event: ErrorEvent) => {
      const message = event.message || String(event.error ?? "");
      void recoverFromChunkFailure(message);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
      void recoverFromChunkFailure(reason);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      // Back/forward cache restore after a deploy is a classic ChunkLoadError source.
      if (event.persisted) {
        void softRefreshIfDeployStale(buildId);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt == null) return;
      const awayMs = Date.now() - hiddenAt;
      if (awayMs >= LONG_BACKGROUND_MS) {
        void softRefreshIfDeployStale(buildId);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(RECOVERY_CHANNEL);
      channel.onmessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; target?: string } | null;
        if (data?.type !== "soft-refresh") return;
        // Never yank an auth flow mid-PIN / OTP entry.
        const here = window.location.pathname || "/";
        if (here.startsWith("/auth") || here.startsWith("/admin/auth") || here.startsWith("/hard/auth")) {
          return;
        }
        const target =
          typeof data.target === "string" && data.target.startsWith("/")
            ? data.target
            : here;
        // Sibling tab already cleared caches — follow without re-entering recovery loops.
        window.location.replace(target);
      };
    } catch {
      channel = null;
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        channel?.close();
      } catch {
        /* ignore */
      }
    };
  }, [buildId]);

  return null;
}
