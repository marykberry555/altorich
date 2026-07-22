import { NextResponse } from "next/server";
import { DEFAULT_HOMEPAGE_STATS, type HomepageStatsConfig } from "@/lib/homepage/homepage-stats";
import { getServiceRoleServices } from "@/lib/services";
import { logger } from "@/lib/logger";

export const revalidate = 60;

let cachedStats: { at: number; stats: HomepageStatsConfig } | null = null;
const CACHE_MS = 60_000;

/** Public homepage statistics configuration (admin-editable). */
export async function GET() {
  try {
    if (cachedStats && Date.now() - cachedStats.at < CACHE_MS) {
      return NextResponse.json(
        { stats: cachedStats.stats },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
      );
    }

    const services = await getServiceRoleServices();
    const stats = services ? await services.settings.getHomepageStats() : DEFAULT_HOMEPAGE_STATS;
    cachedStats = { at: Date.now(), stats };
    return NextResponse.json(
      { stats },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
        }
      }
    );
  } catch (error) {
    logger.warn("Homepage stats fallback", {
      message: error instanceof Error ? error.message : String(error),
      route: "/api/homepage/stats"
    });
    return NextResponse.json({ stats: DEFAULT_HOMEPAGE_STATS });
  }
}
