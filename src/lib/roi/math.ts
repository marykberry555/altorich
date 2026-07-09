import { SECONDS_IN_WEEK, clamp01 } from "@/lib/roi/time";

export function computeWeeklyTicker(input: {
  principalNgn: number;
  weeklyRoiBps: number;
  cycleStartedAt: string;
  cycleEndsAt: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const start = new Date(input.cycleStartedAt);
  const totalSeconds = SECONDS_IN_WEEK;
  const elapsed = (now.getTime() - start.getTime()) / 1000;
  const progress = clamp01(elapsed / totalSeconds);

  const weeklyInterest = Number(input.principalNgn) * (Number(input.weeklyRoiBps) / 10_000);
  const accrued = weeklyInterest * progress;
  const perSecond = weeklyInterest / totalSeconds;

  return { progress, weeklyInterest, perSecond, accrued };
}

