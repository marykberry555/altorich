"use client";

import { useEffect, useRef, useState } from "react";
import { formatNaira } from "@/lib/domain";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  className?: string;
};

export function AnimatedEarningsCounter({ value, className }: Props) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const duration = 420;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return (
    <span className={cn("tabular-nums tracking-tight transition-colors duration-300", className)} aria-live="polite">
      {formatNaira(display)}
    </span>
  );
}
