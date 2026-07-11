"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  isStandaloneDisplay,
  recordPwaVisit,
  type BeforeInstallPromptEvent
} from "@/lib/pwa/runtime";

type PwaContextValue = {
  isStandalone: boolean;
  isOnline: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
  promptInstall: () => Promise<boolean>;
  applyUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    setIsOnline(navigator.onLine);
    recordPwaVisit();

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Service worker disabled during stability incident — stale caches crash hydration.
    // void registerServiceWorker().then((registration) => { ... });

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome === "accepted";
  }, [installPrompt]);

  const applyUpdate = useCallback(async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("altorich-")).map((key) => caches.delete(key)));
    }
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_CACHES" });
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      isStandalone,
      isOnline,
      canInstall: Boolean(installPrompt) && !isStandalone,
      updateAvailable,
      promptInstall,
      applyUpdate
    }),
    [isStandalone, isOnline, installPrompt, updateAvailable, promptInstall, applyUpdate]
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
