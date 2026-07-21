"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Only show offline banner after the browser reports offline AND a cheap
 * connectivity probe fails. Avoids false "you're offline" / network banners
 * on flaky Nigerian mobile networks where navigator.onLine flickers.
 */
export function OfflineIndicator() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let debounceTimer: number | undefined;
    let probeTimer: number | undefined;

    const probe = async () => {
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`/api/health?_=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal
        });
        window.clearTimeout(timer);
        return res.ok || res.status < 500;
      } catch {
        return false;
      }
    };

    const evaluate = () => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        void (async () => {
          if (navigator.onLine) {
            if (!cancelled) setShow(false);
            return;
          }
          // Wait briefly — many "offline" blips recover within a second.
          await new Promise((r) => {
            probeTimer = window.setTimeout(r, 1200);
          });
          if (cancelled) return;
          if (navigator.onLine) {
            setShow(false);
            return;
          }
          const reachable = await probe();
          if (!cancelled) setShow(!reachable);
        })();
      }, 400);
    };

    evaluate();
    window.addEventListener("online", evaluate);
    window.addEventListener("offline", evaluate);
    return () => {
      cancelled = true;
      window.clearTimeout(debounceTimer);
      window.clearTimeout(probeTimer);
      window.removeEventListener("online", evaluate);
      window.removeEventListener("offline", evaluate);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[80] flex items-center justify-center gap-2 bg-[var(--navy)] px-4 py-2 text-xs font-medium text-white">
      <WifiOff size={14} aria-hidden />
      You&apos;re offline — reconnect to continue. Your account is safe.
    </div>
  );
}
