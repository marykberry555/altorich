import type { WelcomeBonusConfig } from "@/lib/welcome-bonus/config";

export type WelcomeBonusProgrammeStatus = {
  enabled: boolean;
  amount: number;
  maxAllocations: number;
  allocated: number;
  remaining: number;
  qualificationDays: number;
  fullyAllocated: boolean;
};

export function buildProgrammeStatus(
  config: WelcomeBonusConfig,
  allocated: number,
  programmeEnabled = true
): WelcomeBonusProgrammeStatus {
  const maxAllocations = config.max_allocations;
  const safeAllocated = Math.max(0, allocated);
  return {
    enabled: config.enabled && programmeEnabled,
    amount: config.amount_ngn,
    maxAllocations,
    allocated: safeAllocated,
    remaining: Math.max(maxAllocations - safeAllocated, 0),
    qualificationDays: config.qualification_days,
    fullyAllocated: safeAllocated >= maxAllocations
  };
}

export type SlotCounterVariant = "open" | "full" | "closed";

export function resolveSlotCounterVariant(status: WelcomeBonusProgrammeStatus): SlotCounterVariant {
  if (!status.enabled) return "closed";
  if (status.fullyAllocated) return "full";
  return "open";
}
