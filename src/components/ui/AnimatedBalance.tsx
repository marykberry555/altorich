"use client";

import { AnimatedEarningsCounter } from "@/components/investment/AnimatedEarningsCounter";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  className?: string;
  decimals?: number;
};

/** Count-up money display for static balances (wallet, stats). */
export function AnimatedBalance({ value, className, decimals = 2 }: Props) {
  return (
    <AnimatedEarningsCounter
      value={value}
      decimals={decimals}
      className={cn("currency-ngn tabular-nums", className)}
    />
  );
}
