/** Central config for the public Live Activity social-proof system. */
export const LIVE_ACTIVITY_CONFIG = {
  /** Max cards shown per browser session (sessionStorage). */
  maxPerSession: 12,
  /** How long each card stays visible (ms). */
  displayDurationMs: { min: 6_000, max: 8_000 },
  /** Delay before the first card after page load (ms). */
  firstDelayMs: { min: 15_000, max: 25_000 },
  /** Delay between subsequent cards (ms). */
  subsequentDelayMs: { min: 40_000, max: 60_000 },
  /** Soft fade / slide duration (ms). */
  animationDurationMs: 420,
  /** Client cache TTL for fetched activities (ms). */
  clientCacheTtlMs: 5 * 60_000,
  /** Server Cache-Control for the public API. */
  apiCacheSeconds: 60,
  /** How far back to look for real platform events. */
  lookbackDays: 14,
  /** Max real rows fetched per activity type. */
  fetchLimitPerType: 24,
  storageKeys: {
    shownCount: "altorich.liveActivity.shownCount",
    seenIds: "altorich.liveActivity.seenIds"
  },
  /**
   * Display is gated by `isLiveActivityPath` (marketing routes + signed-out).
   * Documented public examples for product/QA reference:
   */
  documentedPublicPages: [
    "/",
    "/packages",
    "/about",
    "/learn/faq",
    "/contact",
    "/learn/how-it-works",
    "/download",
    "/learn"
  ]
} as const;

export type LiveActivityType = "joined" | "invested" | "payout" | "reinvested";

export const LIVE_ACTIVITY_LABELS: Record<LiveActivityType, (amountLabel?: string) => string> = {
  joined: () => "Joined Alto Rich",
  invested: (amount) => (amount ? `Invested ${amount}` : "Invested"),
  payout: (amount) => (amount ? `Received ${amount} payout` : "Received a payout"),
  reinvested: (amount) => (amount ? `Reinvested ${amount}` : "Reinvested")
};

/** Nigerian cities / areas shown for privacy-safe location. */
export const LIVE_ACTIVITY_CITIES = [
  "Victoria Island",
  "Lekki",
  "Ikeja",
  "Surulere",
  "Abuja",
  "Port Harcourt",
  "Aba",
  "Owerri",
  "Enugu",
  "Benin City",
  "Uyo",
  "Asaba",
  "Kano",
  "Kaduna",
  "Ibadan",
  "Yaba",
  "Ajah",
  "Wuse",
  "Garki",
  "Onitsha"
] as const;
