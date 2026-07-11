"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  identifySmartsuppVisitor,
  isSmartsuppEnabled,
  SMARTSUPP_REFRESH_EVENT,
  type SmartsuppIdentity
} from "@/lib/chat/smartsupp";

export function SmartsuppBridge() {
  const syncIdentity = useCallback(async () => {
    if (!isSmartsuppEnabled()) return;

    try {
      const response = await fetch("/api/smartsupp/identity", { cache: "no-store" });
      if (!response.ok) return;
      const identity = (await response.json()) as SmartsuppIdentity;
      identifySmartsuppVisitor(identity);
    } catch {
      // Fail silently — chat should never block the app
    }
  }, []);

  useEffect(() => {
    void syncIdentity();

    function onRefresh() {
      void syncIdentity();
    }

    window.addEventListener(SMARTSUPP_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(SMARTSUPP_REFRESH_EVENT, onRefresh);
  }, [syncIdentity]);

  return null;
}

export function SmartsuppWelcomeHint() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isSmartsuppEnabled()) return;
    if (sessionStorage.getItem("altorich-smartsupp-welcome") === "1") return;

    const showTimer = window.setTimeout(() => setVisible(true), 3500);
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("altorich-smartsupp-welcome", "1");
    }, 11500);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  function dismiss() {
    setDismissed(true);
    setVisible(false);
    sessionStorage.setItem("altorich-smartsupp-welcome", "1");
  }

  if (!visible || dismissed) return null;

  return (
    <div
      className="smartsupp-welcome-hint pointer-events-auto fixed bottom-[calc(5.5rem+var(--smartsupp-offset-bottom,0px))] right-4 z-[9998] max-w-[min(18rem,calc(100vw-2rem))] animate-fade-up rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-md sm:bottom-[calc(5rem+var(--smartsupp-offset-bottom,0px))] sm:right-6"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-[var(--text-subtle)] transition hover:bg-[var(--gray-100)] hover:text-[var(--text-muted)]"
        aria-label="Dismiss welcome message"
      >
        <X size={14} />
      </button>
      <p className="pr-5 text-sm font-semibold leading-snug text-[var(--heading)]">
        👋 Welcome to Alto Rich.
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">How can we help you today?</p>
    </div>
  );
}
