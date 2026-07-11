import { nextMondayAt9amLagos } from "@/lib/roi/time";

const WAT = "Africa/Lagos";

function lagosParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WAT,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  }).formatToParts(date);

  return {
    weekday: parts.find((p) => p.type === "weekday")?.value ?? "",
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? 0),
    minute: Number(parts.find((p) => p.type === "minute")?.value ?? 0)
  };
}

/** Whether ops processing is active for the current weekly cycle (Monday from 09:00 WAT). */
export function isPayoutProcessingOpen(now = new Date()) {
  const { weekday, hour, minute } = lagosParts(now);
  if (weekday !== "Monday") return false;
  return hour > 9 || (hour === 9 && minute >= 0);
}

export function nextPayoutProcessingAt(now = new Date()) {
  return nextMondayAt9amLagos(now);
}

export function resolvePayoutQueue(input: { now?: Date } = {}) {
  const now = input.now ?? new Date();

  if (isPayoutProcessingOpen(now)) {
    return { status: "pending" as const, scheduledAt: now };
  }

  const scheduledAt = nextPayoutProcessingAt(now);
  return { status: "scheduled" as const, scheduledAt };
}

export function formatPayoutScheduleMessage(scheduledAt: Date) {
  const label = scheduledAt.toLocaleString("en-NG", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: WAT,
    hour12: true
  });

  return `Your payout request has been received successfully. It is scheduled for processing on ${label}.`;
}

export function formatPayoutQueuedMessage() {
  return "Your payout request has been queued. Funds will be processed during the next payout cycle.";
}
