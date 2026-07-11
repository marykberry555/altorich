"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminPwa } from "@/components/admin-app/AdminAppPwaProvider";

export function AdminInstallBanner() {
  const { canInstall, promptInstall, isStandalone } = useAdminPwa();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone) setDismissed(true);
  }, [isStandalone]);

  if (!canInstall || dismissed) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-white">Install Alto Rich Admin</p>
        <p className="text-xs text-zinc-300">Add the operations console to your home screen for faster access.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" className="gap-2" onClick={() => void promptInstall()}>
          <Download size={16} />
          Install
        </Button>
        <button type="button" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5" onClick={() => setDismissed(true)} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
