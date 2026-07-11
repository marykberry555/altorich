"use client";

import { useEffect, useRef, useState } from "react";
import { formatNaira, formatNairaLive } from "@/lib/domain";
import type { LiveAccrualTick, LiveRateTick } from "@/lib/investment-accrual-live";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  className?: string;
  /** Continuous kobo-level tick synced to accrual period math. */
  liveAccrual?: LiveAccrualTick;
  /** Linear extrapolation from a known rate (portfolio aggregate). */
  liveRate?: LiveRateTick;
  decimals?: number;
  showRatePerSecond?: boolean;
};

function accrualAt(tick: LiveAccrualTick, nowMs: number) {
  const periodMs = Math.max(1, tick.periodEndMs - tick.periodStartMs);
  const elapsed = Math.min(Math.max(0, nowMs - tick.periodStartMs), periodMs);
  const progress = elapsed / periodMs;
  return {
    amount: tick.creditedTotal + tick.periodTarget * progress,
    ratePerSecond: (tick.periodTarget / periodMs) * 1000
  };
}

export function AnimatedEarningsCounter({
  value,
  className,
  liveAccrual,
  liveRate,
  decimals = 3,
  showRatePerSecond = false
}: Props) {
  const [display, setDisplay] = useState(value);
  const [ratePerSecond, setRatePerSecond] = useState(0);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    if (liveAccrual) {
      const tick = () => {
        const { amount, ratePerSecond: rate } = accrualAt(liveAccrual, Date.now());
        setDisplay(amount);
        setRatePerSecond(rate);
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }

    if (liveRate && liveRate.ratePerSecond > 0) {
      const tick = () => {
        const elapsedSec = (Date.now() - liveRate.anchorMs) / 1000;
        setDisplay(liveRate.baseAmount + liveRate.ratePerSecond * elapsedSec);
        setRatePerSecond(liveRate.ratePerSecond);
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
      return () => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current);
      };
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const duration = 420;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, liveAccrual, liveRate]);

  const isLive = Boolean(liveAccrual || liveRate);
  const formatted = isLive ? formatNairaLive(display, decimals) : formatNaira(display);

  return (
    <span className={cn("tabular-nums tracking-tight", className)} aria-live="polite">
      {formatted}
      {showRatePerSecond && isLive && ratePerSecond > 0 ? (
        <span className="ml-2 text-[0.65em] font-medium opacity-75">
          +{formatNairaLive(ratePerSecond, decimals)}/sec
        </span>
      ) : null}
    </span>
  );
}
