"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  label: string;
  className?: string;
};

export function AnimatedCountdownDigit({ value, label, className }: Props) {
  const prev = useRef(value);
  const changed = prev.current !== value;

  useEffect(() => {
    prev.current = value;
  }, [value]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(6,78,59,0.18)] backdrop-blur-md transition-transform duration-300 sm:h-16 sm:w-16",
          changed && "scale-[1.04]"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" aria-hidden />
        <span
          key={value}
          className="animate-[countdown-pop_0.35s_ease-out] text-xl font-bold tabular-nums tracking-tight text-white sm:text-2xl"
        >
          {value}
        </span>
      </div>
      <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">{label}</span>
    </div>
  );
}
