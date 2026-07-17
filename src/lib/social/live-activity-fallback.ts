import type { LiveActivityType } from "@/lib/social/live-activity-config";
import { formatActivityNaira } from "@/lib/social/live-activity-format";
import { FALLBACK_LOCATIONS, formatLocationLabel } from "@/lib/location/ng-locations";
import type { LiveActivity } from "@/lib/social/live-activity-types";

type FallbackSeed = {
  type: LiveActivityType;
  firstName: string;
  locationIndex: number;
  amount?: number;
  minutesAgo: number;
};

const FALLBACK_SEEDS: FallbackSeed[] = [
  { type: "joined", firstName: "Fatima", locationIndex: 0, minutesAgo: 1 },
  { type: "invested", firstName: "Olukoye", locationIndex: 1, amount: 50_000, minutesAgo: 3 },
  { type: "payout", firstName: "Uchenna", locationIndex: 8, amount: 500_000, minutesAgo: 300 },
  { type: "reinvested", firstName: "Blessing", locationIndex: 7, amount: 250_000, minutesAgo: 12 },
  { type: "joined", firstName: "Chinedu", locationIndex: 2, minutesAgo: 8 },
  { type: "invested", firstName: "Amina", locationIndex: 4, amount: 100_000, minutesAgo: 18 },
  { type: "payout", firstName: "Tola", locationIndex: 3, amount: 75_000, minutesAgo: 45 },
  { type: "reinvested", firstName: "Ifeoma", locationIndex: 9, amount: 120_000, minutesAgo: 22 },
  { type: "joined", firstName: "Yusuf", locationIndex: 14, minutesAgo: 6 },
  { type: "invested", firstName: "Ngozi", locationIndex: 10, amount: 250_000, minutesAgo: 35 },
  { type: "payout", firstName: "Emeka", locationIndex: 11, amount: 1_500_000, minutesAgo: 180 },
  { type: "reinvested", firstName: "Halima", locationIndex: 15, amount: 80_000, minutesAgo: 55 },
  { type: "joined", firstName: "Adaeze", locationIndex: 12, minutesAgo: 14 },
  { type: "invested", firstName: "Seyi", locationIndex: 16, amount: 500_000, minutesAgo: 9 },
  { type: "payout", firstName: "Kemi", locationIndex: 6, amount: 210_000, minutesAgo: 90 },
  { type: "reinvested", firstName: "Musa", locationIndex: 13, amount: 60_000, minutesAgo: 28 },
  { type: "joined", firstName: "Zainab", locationIndex: 5, minutesAgo: 4 },
  { type: "invested", firstName: "Chisom", locationIndex: 4, amount: 75_000, minutesAgo: 41 },
  { type: "payout", firstName: "Ibrahim", locationIndex: 19, amount: 320_000, minutesAgo: 240 },
  { type: "reinvested", firstName: "Funke", locationIndex: 17, amount: 150_000, minutesAgo: 16 }
];

/** Curated anonymized Nigerian fallback pool — same formatting as live profile locations. */
export function buildFallbackActivities(now = Date.now()): LiveActivity[] {
  return FALLBACK_SEEDS.map((seed, index) => {
    const loc = FALLBACK_LOCATIONS[seed.locationIndex % FALLBACK_LOCATIONS.length];
    return {
      id: `fallback-${seed.type}-${seed.firstName.toLowerCase()}-${index}`,
      type: seed.type,
      firstName: seed.firstName,
      cityArea: loc.cityArea,
      stateCode: loc.stateCode,
      locationLabel: formatLocationLabel(loc.stateCode, loc.cityArea),
      amountLabel: seed.amount != null ? formatActivityNaira(seed.amount) : undefined,
      occurredAt: new Date(now - seed.minutesAgo * 60_000).toISOString(),
      source: "fallback" as const
    };
  });
}
