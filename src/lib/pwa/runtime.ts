"use client";

import { PWA } from "@/lib/pwa/config";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function canInstallPwa() {
  if (typeof window === "undefined") return false;
  return !isStandaloneDisplay();
}

export function getInstallDismissState() {
  if (typeof window === "undefined") return { visits: 0, never: false, dismissedAt: 0 };
  const visits = Number(localStorage.getItem(PWA.installVisitKey) ?? "0");
  const never = localStorage.getItem(PWA.installNeverKey) === "1";
  const dismissedAt = Number(localStorage.getItem(PWA.installDismissKey) ?? "0");
  return { visits, never, dismissedAt };
}

export function recordPwaVisit() {
  if (typeof window === "undefined") return;
  const { visits } = getInstallDismissState();
  localStorage.setItem(PWA.installVisitKey, String(visits + 1));
}

export function dismissInstallPrompt(untilDays = 7) {
  localStorage.setItem(PWA.installDismissKey, String(Date.now() + untilDays * 86_400_000));
}

export function dismissInstallForever() {
  localStorage.setItem(PWA.installNeverKey, "1");
}

export function shouldShowInstallPrompt() {
  if (!canInstallPwa()) return false;
  const { visits, never, dismissedAt } = getInstallDismissState();
  if (never) return false;
  if (Date.now() < dismissedAt) return false;
  return visits >= 2;
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}
