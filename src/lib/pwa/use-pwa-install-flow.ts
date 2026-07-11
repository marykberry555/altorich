"use client";

import { useCallback, useState } from "react";
import { usePwaOptional } from "@/components/pwa/PwaProvider";

export function usePwaInstallFlow(showInstructionsOnFallback = false) {
  const pwa = usePwaOptional();
  const [showHelp, setShowHelp] = useState(false);

  const handleInstall = useCallback(async () => {
    if (pwa?.canInstall) {
      const ok = await pwa.promptInstall();
      if (!ok && showInstructionsOnFallback) setShowHelp(true);
      return;
    }
    if (showInstructionsOnFallback) setShowHelp(true);
  }, [pwa, showInstructionsOnFallback]);

  return { pwa, showHelp, setShowHelp, handleInstall };
}
