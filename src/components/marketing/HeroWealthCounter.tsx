"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatNairaWithKobo,
  wealthGrowthValueAt,
  type HomepageStatsConfig
} from "@/lib/homepage/homepage-stats";
import { cn } from "@/lib/utils";

type Props = {
  config: HomepageStatsConfig;
  className?: string;
};

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Compact live wealth counter for the homepage hero. */
export function HeroWealthCounter({ config, className }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  // Empty until mount — wealthGrowthValueAt() is time-based and would hydrate-mismatch (#418).
  const [counterLabel, setCounterLabel] = useState("");
  const [mounted, setMounted] = useState(false);
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let raf = 0;
    let interval = 0;
    let lastLabel = "";

    const paint = () => {
      const label = formatNairaWithKobo(wealthGrowthValueAt(config));
      if (label === lastLabel) return;
      lastLabel = label;
      setCounterLabel(label);
      if (valueRef.current) valueRef.current.textContent = label;
    };

    paint();
    interval = window.setInterval(paint, reducedMotion ? 200 : 50);

    if (!reducedMotion) {
      const tick = () => {
        paint();
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      window.clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [config, reducedMotion, mounted]);

  return (
    <div className={cn("max-w-xl text-center", className)}>
      <p className="text-sm font-semibold tracking-tight text-[var(--heading)] sm:text-base">
        {config.wealthGrowthHeadline}
      </p>
      <p
        className={cn(
          "mt-2 font-black tabular-nums tracking-tight text-[var(--emerald)]",
          "text-[clamp(2rem,6.5vw,3rem)] leading-none",
          "drop-shadow-[0_0_24px_rgba(16,185,129,0.35)]"
        )}
        aria-live="off"
      >
        <span ref={valueRef} suppressHydrationWarning>
          {mounted ? counterLabel : "\u00a0"}
        </span>
      </p>
    </div>
  );
}
