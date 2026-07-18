"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  isIosDevice,
  isStandaloneDisplay,
  type BeforeInstallPromptEvent
} from "@/lib/pwa/runtime";
import { ADMIN_APP_HOME, ADMIN_APP_SW } from "@/lib/admin-app/constants";

type AdminPwaContextValue = {
  isStandalone: boolean;
  isIos: boolean;
  /** Native Chromium install prompt is available. */
  canInstall: boolean;
  /** Show Share → Add to Home Screen (iOS Safari / no beforeinstallprompt). */
  showIosHelp: boolean;
  /** Show generic manual install help when native prompt is unavailable. */
  showManualHelp: boolean;
  promptInstall: () => Promise<boolean>;
  pushReady: boolean;
  subscribePush: () => Promise<boolean>;
};

const AdminPwaContext = createContext<AdminPwaContextValue | null>(null);

export function AdminAppPwaProvider({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushReady, setPushReady] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());
    setIsIos(isIosDevice());

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(ADMIN_APP_SW, { scope: `${ADMIN_APP_HOME}/` })
        .then((registration) => {
          // Ensure the page is controlled so Chromium can mark the app installable.
          if (!navigator.serviceWorker.controller) {
            registration.update().catch(() => undefined);
          }
        })
        .catch(() => undefined);
    }

    fetch("/api/admin/push/subscribe")
      .then((r) => r.json())
      .then((data: { configured?: boolean; publicKey?: string | null }) => {
        setPushReady(Boolean(data.configured && data.publicKey));
        setVapidKey(data.publicKey ?? null);
      })
      .catch(() => undefined);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome === "accepted";
  }, [installPrompt]);

  const subscribePush = useCallback(async () => {
    if (!pushReady || !vapidKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const res = await fetch("/api/admin/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
      })
    });

    return res.ok;
  }, [pushReady, vapidKey]);

  const canInstall = Boolean(installPrompt) && !isStandalone;
  const showIosHelp = isIos && !isStandalone && !canInstall;
  const showManualHelp = !isStandalone && !canInstall && !isIos;

  const value = useMemo(
    () => ({
      isStandalone,
      isIos,
      canInstall,
      showIosHelp,
      showManualHelp,
      promptInstall,
      pushReady,
      subscribePush
    }),
    [
      isStandalone,
      isIos,
      canInstall,
      showIosHelp,
      showManualHelp,
      promptInstall,
      pushReady,
      subscribePush
    ]
  );

  return <AdminPwaContext.Provider value={value}>{children}</AdminPwaContext.Provider>;
}

export function useAdminPwa() {
  const ctx = useContext(AdminPwaContext);
  if (!ctx) throw new Error("useAdminPwa must be used within AdminAppPwaProvider");
  return ctx;
}

export function useAdminPwaOptional() {
  return useContext(AdminPwaContext);
}
