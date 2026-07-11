/** @deprecated UI-only legacy tiers — funding accepts any amount ≥ MIN_FUNDING_AMOUNT_NGN from @/lib/payments */
export const contributionTiers = [
  3_000, 6_000, 12_000, 25_000, 50_000, 100_000, 200_000, 500_000, 1_000_000
] as const;

/** Official Nigerian Naira sign (U+20A6) — two horizontal strokes in supported fonts. */
export const NAIRA_SYMBOL = "\u20A6";

export function formatNaira(amount: number) {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(abs);
  const sign = amount < 0 ? "−" : "";
  return `${sign}${NAIRA_SYMBOL}${formatted}`;
}

export function makeReference(phone: string, prefix = "AR") {
  const digits = phone.replace(/\D/g, "").slice(-6) || "MEMBER";
  return `${prefix}-${digits}-${Date.now().toString().slice(-5)}`;
}

export function isWithdrawalWindow(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    hour: "numeric",
    hour12: false,
    timeZone: "Africa/Lagos"
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);

  return (weekday === "Monday" || weekday === "Thursday") && hour >= 8;
}

export function nextWithdrawalLabel(date = new Date()) {
  if (isWithdrawalWindow(date)) return "Open now";

  const watDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Africa/Lagos"
  }).format(date);

  if (watDay === "Monday" || watDay === "Tuesday" || watDay === "Wednesday") {
    return "Next window: Thursday, 8:00 AM WAT";
  }

  return "Next window: Monday, 8:00 AM WAT";
}

export function planTotalReturn(projectedDaily: number, cycleDays: number) {
  return projectedDaily * cycleDays;
}
