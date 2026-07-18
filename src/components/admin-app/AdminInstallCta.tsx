"use client";

import { useState } from "react";
import { Check, Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminPwa } from "@/components/admin-app/AdminAppPwaProvider";
import { ADMIN_APP_INSTALL } from "@/lib/admin-app/constants";
import { cn } from "@/lib/utils";

type Variant = "card" | "compact" | "footer";

type Props = {
  variant?: Variant;
  className?: string;
};

export function AdminInstallCta({ variant = "card", className }: Props) {
  const { isStandalone, canInstall, showIosHelp, showManualHelp, promptInstall } = useAdminPwa();
  const [busy, setBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(variant === "card");

  if (isStandalone) {
    if (variant === "footer") {
      return (
        <p className={cn("px-3 py-2 text-[11px]", className)} style={{ color: "var(--admin-muted)" }}>
          Admin app installed
        </p>
      );
    }
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200",
          className
        )}
      >
        <Check size={16} aria-hidden />
        Admin app is installed on this device
      </div>
    );
  }

  async function onInstall() {
    if (!canInstall || busy) return;
    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  }

  if (variant === "footer") {
    return (
      <div className={cn("space-y-2 border-t px-3 py-3", className)} style={{ borderColor: "var(--admin-border)" }}>
        {canInstall ? (
          <button
            type="button"
            onClick={() => void onInstall()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition touch-manipulation"
            style={{ background: "var(--admin-emerald-soft)", color: "var(--admin-emerald-text)" }}
          >
            <Download size={16} aria-hidden />
            Install Admin App
          </button>
        ) : showIosHelp ? (
          <>
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition touch-manipulation"
              style={{ background: "var(--admin-hover)", color: "var(--admin-text)" }}
            >
              <Share size={16} aria-hidden />
              Add to Home Screen
            </button>
            {helpOpen ? <IosHelp className="text-[11px]" /> : null}
          </>
        ) : (
          <a
            href={ADMIN_APP_INSTALL}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition touch-manipulation"
            style={{ background: "var(--admin-hover)", color: "var(--admin-text)" }}
          >
            <Download size={16} aria-hidden />
            Install Admin App
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4",
        variant === "compact" && "p-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Smartphone size={16} className="text-emerald-400" aria-hidden />
            Install Admin App
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {canInstall
              ? "Add the operations console to your device for faster access."
              : showIosHelp
                ? "On iPhone / iPad, use Share → Add to Home Screen."
                : "Use your browser install menu, or open the install page."}
          </p>
        </div>

        {canInstall ? (
          <Button type="button" size="sm" className="gap-2 shrink-0" disabled={busy} onClick={() => void onInstall()}>
            <Download size={16} aria-hidden />
            Install Admin App
          </Button>
        ) : showIosHelp ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2 shrink-0 border-white/15 bg-white/5 text-white"
            onClick={() => setHelpOpen((v) => !v)}
          >
            <Share size={16} aria-hidden />
            How to install
          </Button>
        ) : showManualHelp ? (
          <a href={ADMIN_APP_INSTALL}>
            <Button type="button" size="sm" variant="outline" className="gap-2 shrink-0 border-white/15 bg-white/5 text-white">
              <Download size={16} aria-hidden />
              Install Admin App
            </Button>
          </a>
        ) : null}
      </div>

      {helpOpen && showIosHelp ? (
        <div className="mt-3">
          <IosHelp />
        </div>
      ) : null}
      {helpOpen && showManualHelp ? (
        <div className="mt-3">
          <ManualHelp />
        </div>
      ) : null}
    </div>
  );
}

function IosHelp({ className }: { className?: string }) {
  return (
    <ol className={cn("list-decimal space-y-1 pl-4 text-xs text-zinc-400", className)}>
      <li>
        Tap <strong className="text-zinc-200">Share</strong> in Safari
      </li>
      <li>
        Choose <strong className="text-zinc-200">Add to Home Screen</strong>
      </li>
      <li>Confirm to install Alto Rich Admin</li>
    </ol>
  );
}

function ManualHelp({ className }: { className?: string }) {
  return (
    <ul className={cn("list-disc space-y-1 pl-4 text-xs text-zinc-400", className)}>
      <li>
        <strong className="text-zinc-200">Chrome / Edge / Samsung Internet:</strong> browser menu → Install app
      </li>
      <li>
        Or open{" "}
        <a href={ADMIN_APP_INSTALL} className="text-emerald-400 hover:underline">
          {ADMIN_APP_INSTALL}
        </a>
      </li>
    </ul>
  );
}
