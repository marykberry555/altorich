"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared 1s clock — only components that call useLiveNow() re-render.
 * Do not put a React context Provider around the app shell for this.
 */
let nowMs = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function ensureTimer() {
  if (timer != null || typeof window === "undefined") return;
  timer = setInterval(() => {
    nowMs = Date.now();
    for (const listener of listeners) listener();
  }, 1000);
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  ensureTimer();
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer != null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return nowMs;
}

function getServerSnapshot() {
  return nowMs;
}

export function useLiveNow() {
  const ms = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return new Date(ms);
}

/** @deprecated No longer needed — kept so existing imports compile. */
export function LiveNowProvider({ children }: { children: React.ReactNode; intervalMs?: number }) {
  return children;
}
