import { nextMondayAt9amLagos } from "@/lib/roi/time";

/** Qualification ends exactly `days` after registration (full consecutive period). */
export function qualificationEndsAt(registeredAt: Date, days: number): Date {
  return new Date(registeredAt.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * First Monday 9:00 AM settlement window AFTER the qualification period completes.
 * Never unlocks at the exact qualification instant unless that instant is already
 * inside/before Monday 9:00 AM and a later Monday is required by nextMondayAt9amLagos.
 */
export function expectedWelcomeBonusUnlockAt(qualificationEndsAt: Date, now = new Date()): Date {
  // Unlock is never before qualification completes.
  const afterQualification = new Date(Math.max(qualificationEndsAt.getTime(), now.getTime()));
  // If qualification just completed, use nextMondayAt9amLagos from that instant.
  // When called at allocation time, pass qualificationEndsAt as the reference "now"
  // so expected_unlock_at is deterministic from registration.
  return nextMondayAt9amLagos(afterQualification);
}

/** Deterministic expected unlock from registration (for storage at award time). */
export function expectedUnlockFromRegistration(registeredAt: Date, qualificationDays: number): {
  qualificationEndsAt: Date;
  expectedUnlockAt: Date;
} {
  const ends = qualificationEndsAt(registeredAt, qualificationDays);
  return {
    qualificationEndsAt: ends,
    expectedUnlockAt: nextMondayAt9amLagos(ends)
  };
}

export function daysRemainingUntil(target: Date, now = new Date()): number {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
