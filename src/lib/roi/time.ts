const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const SECONDS_IN_WEEK = 7 * 24 * 60 * 60; // 604,800

function atLagos(date: Date) {
  // Use Lagos wall clock via Intl. We only need weekday/hour/minute alignment.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const hh = Number(get("hour"));
  const mm = Number(get("minute"));
  const ss = Number(get("second"));
  return { y, m, d, hh, mm, ss };
}

/**
 * Returns a Date representing the next Monday at 09:00 Lagos time.
 * If currently Monday >= 09:00, it returns next week's Monday 09:00.
 */
export function nextMondayAt9amLagos(now = new Date()): Date {
  // Convert to a Lagos-local calendar day, then compute next Monday.
  const { y, m, d, hh, mm, ss } = atLagos(now);
  const lagosNow = new Date(Date.UTC(y, m - 1, d, hh, mm, ss));

  // Weekday in Lagos using UTC weekday of lagosNow (since lagosNow is constructed in UTC with Lagos wall values)
  const weekday = lagosNow.getUTCDay(); // 0=Sun...1=Mon
  const isMonday = weekday === 1;

  const targetToday = new Date(Date.UTC(y, m - 1, d, 9, 0, 0));

  let daysUntilMonday = (8 - weekday) % 7;
  if (daysUntilMonday === 0) daysUntilMonday = 7;

  // If it's Monday and before 09:00, target is today.
  if (isMonday && lagosNow < targetToday) {
    return targetToday;
  }

  const next = new Date(Date.UTC(y, m - 1, d, 9, 0, 0));
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  return next;
}

export function weeklyCountdownTarget(now = new Date()): { target: Date; secondsRemaining: number } {
  const target = nextMondayAt9amLagos(now);
  const secondsRemaining = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return { target, secondsRemaining };
}

/**
 * Weekly ticker window:
 * - Start: Monday 10:01 Lagos time
 * - End: next Monday 10:00 Lagos time
 */
export function currentTickerWindowLagos(now = new Date()): { start: Date; end: Date } {
  const nextMon9 = nextMondayAt9amLagos(now);
  // Derive the Monday date for the *current* cycle end (10:00). If nextMon9 is upcoming Monday 09:00,
  // then cycle end is the same day at 10:00.
  const end = new Date(nextMon9.getTime());
  end.setUTCHours(10, 0, 0, 0);

  const start = new Date(end.getTime() - WEEK_MS);
  start.setUTCHours(10, 1, 0, 0);

  return { start, end };
}

export function clamp01(v: number) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

