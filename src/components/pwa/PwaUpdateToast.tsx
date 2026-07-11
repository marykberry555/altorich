"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaOptional } from "@/components/pwa/PwaProvider";

export function PwaUpdateToast() {
  const pwa = usePwaOptional();
  if (!pwa?.updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 shadow-[var(--shadow-lg)] sm:left-auto">
      <p className="text-sm text-[var(--text-muted)]">A new version of AltoRich is ready.</p>
      <Button type="button" size="sm" onClick={pwa.applyUpdate}>
        <RefreshCw size={14} />
        Update
      </Button>
    </div>
  );
}
