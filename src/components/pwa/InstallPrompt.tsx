"use client";

import { Download, Smartphone, X } from "lucide-react";
import { DownloadAppBadge } from "@/components/pwa/DownloadAppBadge";
import { usePwaOptional } from "@/components/pwa/PwaProvider";

export function InstallPrompt() {
  const pwa = usePwaOptional();

  if (!pwa?.showInstallBanner || pwa.isStandalone) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Alto Rich"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-lg animate-fade-up rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-lg)] sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--emerald-soft)] text-[var(--emerald)]">
          <Smartphone size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--heading)]">Install Alto Rich</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Add Alto Rich to your home screen for quick access to your dashboard and investments.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DownloadAppBadge size="sm" showInstructionsOnFallback />
            <button
              type="button"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--gray-100)]"
              onClick={() => pwa.dismissInstall()}
            >
              Maybe later
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--gray-100)]"
              onClick={() => pwa.dismissInstall(true)}
            >
              Don&apos;t ask again
            </button>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 text-[var(--text-subtle)] transition hover:text-[var(--text)]"
          aria-label="Dismiss"
          onClick={() => pwa.dismissInstall()}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
