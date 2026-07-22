import { NextResponse } from "next/server";
import { DEFAULT_HOMEPAGE_STATS } from "@/lib/homepage/homepage-stats";
import { getServiceRoleServices } from "@/lib/services";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Public homepage statistics configuration (admin-editable). */
export async function GET() {
  try {
    const services = await getServiceRoleServices();
    const stats = services ? await services.settings.getHomepageStats() : DEFAULT_HOMEPAGE_STATS;
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
