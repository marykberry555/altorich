"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isStandaloneDisplay, recordPwaVisit, registerServiceWorker } from "@/lib/pwa/runtime";

type PwaContextValue = {
  isStandalone: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  applyUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    setIsOnline(navigator.onLine);
    recordPwaVisit();

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    void registerServiceWorker().then((registration) => {
      if (!registration) return;
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      isStandalone,
      isOnline,
      updateAvailable,
      applyUpdate
    }),
    [isStandalone, isOnline, updateAvailable, applyUpdate]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwa must be used within PwaProvider");
  return ctx;
}

export function usePwaOptional() {
  return useContext(PwaContext);
}
