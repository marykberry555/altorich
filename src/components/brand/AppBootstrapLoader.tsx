"use client";

import { useEffect, useState } from "react";
import { AppLoader } from "@/components/brand/AppLoader";
import { cn } from "@/lib/utils";

const MIN_VISIBLE_MS = 450;
const DELAY_BEFORE_SHOW_MS = 180;
/** Hard cap — never leave "Hold On" stuck if `load` never fires (blocked asset, hung SW). */
const MAX_VISIBLE_MS = 2800;

export function AppBootstrapLoader() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "exiting">("hidden");

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let exitTimer: number | undefined;
    let maxTimer: number | undefined;
    const startedAt = performance.now();
    let finished = false;

    const beginExit = () => {
      if (finished) return;
      finished = true;
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      hideTimer = window.setTimeout(() => {
        setPhase("exiting");
        exitTimer = window.setTimeout(() => setPhase("hidden"), 320);
      }, remaining);
    };

    const reveal = () => {
      if (performance.now() - startedAt >= DELAY_BEFORE_SHOW_MS) {
        setPhase("visible");
        return;
      }
      showTimer = window.setTimeout(() => setPhase("visible"), DELAY_BEFORE_SHOW_MS);
    };

    if (document.readyState === "complete") {
      reveal();
      beginExit();
    } else {
      reveal();
      window.addEventListener("load", beginExit, { once: true });
    }

    maxTimer = window.setTimeout(beginExit, MAX_VISIBLE_MS);

    return () => {
      finished = true;
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (exitTimer) window.clearTimeout(exitTimer);
      if (maxTimer) window.clearTimeout(maxTimer);
      window.removeEventListener("load", beginExit);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex bg-[var(--surface)] transition-opacity duration-300",
        phase === "exiting" ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      aria-hidden={phase === "exiting"}
    >
      <AppLoader className="w-full animate-[fade-in_0.35s_ease-out]" />
    </div>
  );
}
