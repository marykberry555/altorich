"use client";

import { Download, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { usePwaOptional } from "@/components/pwa/PwaProvider";
import { isIosDevice, isStandaloneDisplay } from "@/lib/pwa/runtime";

export function InstallPrompt() {
  const pwa = usePwaOptional();
  const standalone = isStandaloneDisplay();
  const ios = isIosDevice();

  if (standalone || !pwa?.showInstallBanner) return null;

  return (
    <div
      role="dialog"
      aria-label="Install AltoRich app"
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-lg animate-fade-up rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 shadow-[var(--shadow-lg)] sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--emerald-soft)] text-[var(--emerald)]">
          <Smartphone size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--heading)]">Install AltoRich</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            {ios
              ? "Add AltoRich to your home screen for quick access to your dashboard and investments."
              : "Install the app for a faster, full-screen experience — like a native investment platform."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pwa.canInstall ? (
              <Button type="button" size="sm" onClick={() => void pwa.promptInstall()}>
                <Download size={14} />
                Install now
              </Button>
            ) : (
              <Link href="/download">
                <Button type="button" size="sm">
                  <Download size={14} />
                  How to install
                </Button>
              </Link>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => pwa.dismissInstall()}>
              Maybe later
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => pwa.dismissInstall(true)}>
              Don&apos;t ask again
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 text-[var(--text-subtle)] transition hover:text-[var(--text)]"
          aria-label="Dismiss install prompt"
          onClick={() => pwa.dismissInstall()}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
