"use client";

import { WifiOff } from "lucide-react";
import { usePwaOptional } from "@/components/pwa/PwaProvider";

export function OfflineIndicator() {
  const pwa = usePwaOptional();
  if (pwa?.isOnline !== false) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[80] flex items-center justify-center gap-2 bg-[var(--navy)] px-4 py-2 text-xs font-medium text-white">
      <WifiOff size={14} aria-hidden />
      You&apos;re offline — some actions need a connection
    </div>
  );
}
