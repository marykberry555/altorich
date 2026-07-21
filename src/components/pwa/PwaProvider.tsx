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
  promptInstall: () => Promise<boolean>;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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

  useEffect(() => {
    const onInstalled = () => setIsStandalone(isStandaloneDisplay());
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const value = useMemo(
    () => ({
      isStandalone,
      isOnline,
      canInstall: Boolean(installPrompt) && !isStandalone,
      promptInstall
    }),
    [isStandalone, isOnline, installPrompt, promptInstall]
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
