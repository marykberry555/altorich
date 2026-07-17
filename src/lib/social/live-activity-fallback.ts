import { LIVE_ACTIVITY_CITIES, type LiveActivityType } from "@/lib/social/live-activity-config";
import { formatActivityNaira } from "@/lib/social/live-activity-format";
import type { LiveActivity } from "@/lib/social/live-activity-types";

type FallbackSeed = {
  type: LiveActivityType;
  firstName: string;
  cityIndex: number;
  amount?: number;
  minutesAgo: number;
};

const FALLBACK_SEEDS: FallbackSeed[] = [
  { type: "joined", firstName: "Fatima", cityIndex: 0, minutesAgo: 1 },
  { type: "invested", firstName: "Olukoye", cityIndex: 1, amount: 50_000, minutesAgo: 3 },
  { type: "payout", firstName: "Uchenna", cityIndex: 6, amount: 500_000, minutesAgo: 300 },
  { type: "reinvested", firstName: "Blessing", cityIndex: 5, amount: 250_000, minutesAgo: 12 },
  { type: "joined", firstName: "Chinedu", cityIndex: 2, minutesAgo: 8 },
  { type: "invested", firstName: "Amina", cityIndex: 4, amount: 100_000, minutesAgo: 18 },
  { type: "payout", firstName: "Tola", cityIndex: 3, amount: 75_000, minutesAgo: 45 },
  { type: "reinvested", firstName: "Ifeoma", cityIndex: 8, amount: 120_000, minutesAgo: 22 },
  { type: "joined", firstName: "Yusuf", cityIndex: 12, minutesAgo: 6 },
  { type: "invested", firstName: "Ngozi", cityIndex: 7, amount: 250_000, minutesAgo: 35 },
  { type: "payout", firstName: "Emeka", cityIndex: 9, amount: 1_500_000, minutesAgo: 180 },
  { type: "reinvested", firstName: "Halima", cityIndex: 13, amount: 80_000, minutesAgo: 55 },
  { type: "joined", firstName: "Adaeze", cityIndex: 11, minutesAgo: 14 },
  { type: "invested", firstName: "Seyi", cityIndex: 15, amount: 500_000, minutesAgo: 9 },
  { type: "payout", firstName: "Kemi", cityIndex: 10, amount: 210_000, minutesAgo: 90 },
  { type: "reinvested", firstName: "Musa", cityIndex: 14, amount: 60_000, minutesAgo: 28 },
  { type: "joined", firstName: "Zainab", cityIndex: 16, minutesAgo: 4 },
  { type: "invested", firstName: "Chisom", cityIndex: 17, amount: 75_000, minutesAgo: 41 },
  { type: "payout", firstName: "Ibrahim", cityIndex: 18, amount: 320_000, minutesAgo: 240 },
  { type: "reinvested", firstName: "Funke", cityIndex: 19, amount: 150_000, minutesAgo: 16 }
];

/** Curated anonymized Nigerian fallback pool — used when live data is thin. */
export function buildFallbackActivities(now = Date.now()): LiveActivity[] {
  return FALLBACK_SEEDS.map((seed, index) => ({
    id: `fallback-${seed.type}-${seed.firstName.toLowerCase()}-${index}`,
    type: seed.type,
    firstName: seed.firstName,
    city: LIVE_ACTIVITY_CITIES[seed.cityIndex % LIVE_ACTIVITY_CITIES.length],
    amountLabel: seed.amount != null ? formatActivityNaira(seed.amount) : undefined,
    occurredAt: new Date(now - seed.minutesAgo * 60_000).toISOString(),
    source: "fallback" as const
  }));
}
