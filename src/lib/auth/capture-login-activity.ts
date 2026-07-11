import { getServiceClientOrThrow } from "@/lib/auth/session";
import { clientIpFromHeaders, geoFromRequestHeaders } from "@/lib/auth/user-agent";
import { recordLoginActivity } from "@/services/admin/login-activity.service";

/** Record a successful session establishment for admin activity feeds. */
export async function captureLoginActivity(req: Request, userId: string) {
  try {
    const supabase = await getServiceClientOrThrow();
    const geo = geoFromRequestHeaders(req.headers);
    await recordLoginActivity(supabase, {
      userId,
      userAgent: req.headers.get("user-agent") ?? "",
      ipAddress: clientIpFromHeaders(req.headers),
      city: geo.city,
      region: geo.region,
      country: geo.country,
      isp: geo.isp
    });
  } catch {
    // Non-blocking — never fail auth because activity logging failed.
  }
}
