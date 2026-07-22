import { NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { LIVE_ACTIVITY_CONFIG } from "@/lib/social/live-activity-config";
import { buildFallbackActivities } from "@/lib/social/live-activity-fallback";
import { getLiveActivities } from "@/services/social/live-activity.service";
import type { LiveActivityApiResponse } from "@/lib/social/live-activity-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public anonymized live activity feed for marketing social proof. */
export async function GET() {
  const generatedAt = new Date().toISOString();

  try {
    const services = await getServiceRoleServices();
    const activities = services
      ? await getLiveActivities(services.supabase)
      : buildFallbackActivities();

    const body: LiveActivityApiResponse = { activities, generatedAt };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, max-age=${LIVE_ACTIVITY_CONFIG.apiCacheSeconds}, stale-while-revalidate=120`
      }
    });
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.warn("Live activity fallback", {
      message: error instanceof Error ? error.message : String(error),
      route: "/api/social/live-activity"
    });
    const body: LiveActivityApiResponse = {
      activities: buildFallbackActivities(),
      generatedAt
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, max-age=${LIVE_ACTIVITY_CONFIG.apiCacheSeconds}`
      }
    });
  }
}
