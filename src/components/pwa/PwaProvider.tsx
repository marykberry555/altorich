"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  dismissInstallForever,
  dismissInstallPrompt,
  isStandaloneDisplay,
  recordPwaVisit,
  registerServiceWorker,
  shouldShowInstallPrompt,
  type BeforeInstallPromptEvent
} from "@/lib/pwa/runtime";

type PwaContextValue = {
  isStandalone: boolean;
  isOnline: boolean;
  canInstall: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  updateAvailable: boolean;
  showInstallBanner: boolean;
  promptInstall: () => Promise<boolean>;
  dismissInstall: (forever?: boolean) => void;
  applyUpdate: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

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
      if (shouldShowInstallPrompt()) setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

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

    const timer = window.setTimeout(() => {
      if (shouldShowInstallPrompt() && !isStandaloneDisplay()) setShowInstallBanner(true);
    }, 12_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.clearTimeout(timer);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallBanner(false);
    return choice.outcome === "accepted";
  }, [installPrompt]);

  const dismissInstall = useCallback((forever?: boolean) => {
    if (forever) dismissInstallForever();
    else dismissInstallPrompt();
    setShowInstallBanner(false);
  }, []);

  const applyUpdate = useCallback(() => {
    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      isStandalone,
      isOnline,
      canInstall: Boolean(installPrompt) && !isStandalone,
      installPrompt,
      updateAvailable,
      showInstallBanner,
      promptInstall,
      dismissInstall,
      applyUpdate
    }),
    [isStandalone, isOnline, installPrompt, updateAvailable, showInstallBanner, promptInstall, dismissInstall, applyUpdate]
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
