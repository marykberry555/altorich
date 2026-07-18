import {
  isPayoutProcessingOpen,
  nextPayoutProcessingAt
} from "@/lib/payout/schedule";

export const SETTLEMENT_QUEUE_SETTINGS_KEY = "settlement_queue";

export type SettlementQueueConfig = {
  /** How many withdrawals are processed per batch. */
  batch_size: number;
  /** Minutes between batches (default 10). */
  batch_interval_minutes: number;
  /** When true, admin has paused settlement processing. */
  paused: boolean;
  /**
   * Weekday the settlement window opens (0=Sun … 6=Sat). Default Monday = 1.
   * Display/ops label; window open checks still use schedule helpers unless overridden later.
   */
  opens_weekday: number;
  /** Hour (0–23) in Africa/Lagos when settlement opens. Default 9. */
  opens_hour: number;
  /** Minute (0–59) in Africa/Lagos when settlement opens. Default 0. */
  opens_minute: number;
  /**
   * Optional cap on how many requests can be marked paid per WAT calendar day.
   * null = unlimited.
   */
  max_daily_processing_limit: number | null;
};

export const DEFAULT_SETTLEMENT_QUEUE: SettlementQueueConfig = {
  batch_size: 25,
  batch_interval_minutes: 10,
  paused: false,
  opens_weekday: 1,
  opens_hour: 9,
  opens_minute: 0,
  max_daily_processing_limit: null
};

export function mergeSettlementQueueConfig(
  partial: Partial<SettlementQueueConfig> | null | undefined
): SettlementQueueConfig {
  const batchSize = Number(partial?.batch_size ?? DEFAULT_SETTLEMENT_QUEUE.batch_size);
  const interval = Number(partial?.batch_interval_minutes ?? DEFAULT_SETTLEMENT_QUEUE.batch_interval_minutes);
  const opensWeekday = Number(partial?.opens_weekday ?? DEFAULT_SETTLEMENT_QUEUE.opens_weekday);
  const opensHour = Number(partial?.opens_hour ?? DEFAULT_SETTLEMENT_QUEUE.opens_hour);
  const opensMinute = Number(partial?.opens_minute ?? DEFAULT_SETTLEMENT_QUEUE.opens_minute);
  const rawDaily = partial?.max_daily_processing_limit;
  const dailyLimit =
    rawDaily === null || rawDaily === undefined
      ? null
      : Number.isFinite(Number(rawDaily)) && Number(rawDaily) >= 1
        ? Math.floor(Number(rawDaily))
        : null;

  return {
    batch_size: Number.isFinite(batchSize) && batchSize >= 1 ? Math.floor(batchSize) : DEFAULT_SETTLEMENT_QUEUE.batch_size,
    batch_interval_minutes:
      Number.isFinite(interval) && interval >= 1 ? Math.floor(interval) : DEFAULT_SETTLEMENT_QUEUE.batch_interval_minutes,
    paused: Boolean(partial?.paused ?? false),
    opens_weekday: Number.isFinite(opensWeekday) && opensWeekday >= 0 && opensWeekday <= 6 ? Math.floor(opensWeekday) : 1,
    opens_hour: Number.isFinite(opensHour) && opensHour >= 0 && opensHour <= 23 ? Math.floor(opensHour) : 9,
    opens_minute: Number.isFinite(opensMinute) && opensMinute >= 0 && opensMinute <= 59 ? Math.floor(opensMinute) : 0,
    max_daily_processing_limit: dailyLimit
  };
}

export function formatSettlementOpenLabel(config: SettlementQueueConfig) {
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const day = weekdayNames[config.opens_weekday] ?? "Monday";
  const hour12 = ((config.opens_hour + 11) % 12) + 1;
  const ampm = config.opens_hour >= 12 ? "PM" : "AM";
  const minute = String(config.opens_minute).padStart(2, "0");
  return `${day} ${hour12}:${minute} ${ampm} WAT`;
}

/** Monday 09:00 WAT for the settlement cycle that `now` belongs to (or next if window closed). */
export function settlementWindowStart(now = new Date()): Date {
  if (isPayoutProcessingOpen(now)) {
    // Today is Monday ≥ 09:00 — window started today at 09:00 WAT.
    const next = nextPayoutProcessingAt(now);
    // nextMondayAt9amLagos after Monday 09:00 returns *next* Monday; reconstruct today 09:00.
    return new Date(next.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return nextPayoutProcessingAt(now);
}

/**
 * Estimate when a request at 1-based `queuePosition` will be processed.
 * Batch 1 starts at settlement open; each batch covers `batch_size` requests every `interval` minutes.
 * When daily limit is set and position would exceed remaining capacity today, ETA slides to next window.
 */
export function estimateSettlementProcessingAt(input: {
  queuePosition: number;
  config: SettlementQueueConfig;
  now?: Date;
  /** How many requests already paid today (WAT). Used with max_daily_processing_limit. */
  completedToday?: number;
}): Date {
  const now = input.now ?? new Date();
  const position = Math.max(1, Math.floor(input.queuePosition));
  const { batch_size, batch_interval_minutes, paused, max_daily_processing_limit } = input.config;
  let windowStart = settlementWindowStart(now);

  // If daily cap is exhausted, push ETA to the following week's open.
  if (
    max_daily_processing_limit != null &&
    (input.completedToday ?? 0) + position > max_daily_processing_limit &&
    isPayoutProcessingOpen(now)
  ) {
    windowStart = nextPayoutProcessingAt(new Date(windowStart.getTime() + 24 * 60 * 60 * 1000));
  }

  const batchIndex = Math.ceil(position / batch_size); // 1-based
  let eta = new Date(windowStart.getTime() + (batchIndex - 1) * batch_interval_minutes * 60_000);

  if (paused) {
    if (eta.getTime() < now.getTime()) eta = new Date(now.getTime());
    return eta;
  }

  if (eta.getTime() < now.getTime()) {
    const elapsedMs = Math.max(0, now.getTime() - windowStart.getTime());
    const intervalMs = batch_interval_minutes * 60_000;
    const slotsPassed = Math.floor(elapsedMs / intervalMs);
    const nextSlot = Math.max(batchIndex - 1, slotsPassed);
    eta = new Date(windowStart.getTime() + nextSlot * intervalMs);
    if (eta.getTime() < now.getTime()) {
      eta = new Date(windowStart.getTime() + (slotsPassed + 1) * intervalMs);
    }
  }

  return eta;
}

export function batchNumberForPosition(queuePosition: number, batchSize: number) {
  return Math.max(1, Math.ceil(Math.max(1, queuePosition) / Math.max(1, batchSize)));
}

export function formatSettlementEta(at: Date) {
  return at.toLocaleString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos"
  });
}

export function formatSettlementEtaShort(at: Date, now = new Date()) {
  const time = at.toLocaleString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos"
  });

  const dayLabel = at.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos"
  });

  const sameCalendarDay =
    at.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }) ===
    now.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

  return sameCalendarDay
    ? `Today by approximately ${time} WAT`
    : `${dayLabel} by approximately ${time} WAT`;
}

export function buildQueuedScheduleMessage(input: {
  queuePosition: number;
  estimatedAt: Date;
  settlementReference?: string | null;
}) {
  const etaShort = formatSettlementEtaShort(input.estimatedAt);
  const approx = etaShort.replace(/^Today by approximately /, "").replace(/ WAT$/, " WAT");
  const refLine = input.settlementReference ? `\n\nSettlement reference: ${input.settlementReference}.` : "";
  return (
    `Your withdrawal request has been queued successfully.\n\n` +
    `Due to settlement processing, your estimated payout time is approximately ${approx}.\n\n` +
    `Queue position: #${input.queuePosition}.` +
    refLine +
    `\n\nYou will receive a notification once payment has been completed.`
  );
}

export type MemberQueueStatus = "Queued" | "Under Review" | "Processing" | "Paid" | "Rejected" | "Cancelled" | "Scheduled";

export function memberQueueStatusLabel(row: {
  status: string;
  processing_started_at?: string | null;
  scheduled_at?: string | null;
}): MemberQueueStatus {
  if (row.status === "paid") return "Paid";
  if (row.status === "rejected") return "Rejected";
  if (row.status === "cancelled") return "Cancelled";
  if (row.status === "processing") return "Processing";
  if (row.status === "approved") {
    return row.processing_started_at ? "Processing" : "Under Review";
  }
  if (row.status === "scheduled") return "Scheduled";
  return "Queued";
}
