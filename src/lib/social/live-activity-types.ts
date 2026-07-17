import type { LiveActivityType } from "@/lib/social/live-activity-config";

export type LiveActivity = {
  id: string;
  type: LiveActivityType;
  firstName: string;
  city: string;
  /** Whole-naira display string e.g. ₦50,000 — omit for join events */
  amountLabel?: string;
  occurredAt: string; // ISO
  source: "live" | "fallback";
};

export type LiveActivityApiResponse = {
  activities: LiveActivity[];
  generatedAt: string;
};
