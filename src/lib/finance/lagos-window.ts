/** Africa/Lagos calendar helpers for settlement reporting. */

export function lagosDayKey(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

/** Inclusive Lagos calendar-day window as UTC ISO bounds. */
export function lagosDayBounds(dayKey: string): { startIso: string; endIso: string; dayKey: string } {
  const start = new Date(`${dayKey}T00:00:00+01:00`);
  const end = new Date(`${dayKey}T23:59:59.999+01:00`);
  return { startIso: start.toISOString(), endIso: end.toISOString(), dayKey };
}

/**
 * Lagos week starting Monday 00:00 through Sunday 23:59:59.999.
 * `anchorDayKey` may be any day in the week (YYYY-MM-DD).
 */
export function lagosWeekBounds(anchorDayKey: string): {
  startIso: string;
  endIso: string;
  weekStartKey: string;
  weekEndKey: string;
} {
  const anchor = new Date(`${anchorDayKey}T12:00:00+01:00`);
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short"
  }).format(anchor);
  const offsetFromMonday = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[short] ?? 0;

  const monday = new Date(anchor.getTime() - offsetFromMonday * 24 * 60 * 60 * 1000);
  const weekStartKey = lagosDayKey(monday);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  const weekEndKey = lagosDayKey(sunday);

  return {
    startIso: new Date(`${weekStartKey}T00:00:00+01:00`).toISOString(),
    endIso: new Date(`${weekEndKey}T23:59:59.999+01:00`).toISOString(),
    weekStartKey,
    weekEndKey
  };
}
