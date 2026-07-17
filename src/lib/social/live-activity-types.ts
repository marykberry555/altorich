import type { LiveActivityType } from "@/lib/social/live-activity-config";
import type { NgStateCode } from "@/lib/location/ng-locations";

export type LiveActivity = {
  id: string;
  type: LiveActivityType;
  firstName: string;
  /** Canonical city/area from member profile (or curated fallback). */
  cityArea: string;
  /** Canonical state code (e.g. LA, FC). */
  stateCode: NgStateCode;
  /** Preformatted "City, State" for display (FCT → Abuja). */
  locationLabel: string;
  /** Whole-naira display string e.g. ₦50,000 — omit for join events */
  amountLabel?: string;
  occurredAt: string; // ISO
  source: "live" | "fallback";
};

export type LiveActivityApiResponse = {
  activities: LiveActivity[];
  generatedAt: string;
};
