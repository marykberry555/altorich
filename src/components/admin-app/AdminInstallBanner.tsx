"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminPwa } from "@/components/admin-app/AdminAppPwaProvider";
import { AdminInstallCta } from "@/components/admin-app/AdminInstallCta";

export function AdminInstallBanner() {
  const { canInstall, promptInstall, isStandalone, showIosHelp } = useAdminPwa();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone) setDismissed(true);
  }, [isStandalone]);

  if (dismissed || isStandalone) return null;

  // Native Chromium install available
  if (canInstall) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Install Alto Rich Admin</p>
          <p className="text-xs text-zinc-300">Add the operations console to your home screen for faster access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" className="gap-2" onClick={() => void promptInstall()}>
            <Download size={16} />
            Install Admin App
          </Button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // iOS: show compact helper once (not Chromium-installable)
  if (showIosHelp) {
    return (
      <div className="relative">
        <AdminInstallCta variant="compact" />
        <button
          type="button"
          className="absolute right-2 top-2 rounded-lg p-2 text-zinc-400 hover:bg-white/5"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
}
