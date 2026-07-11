import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const schema = z.object({
  kyc_required: z.boolean().optional(),
  enable_usdt: z.boolean().optional(),
  enable_usdc: z.boolean().optional(),
  enable_bitcoin: z.boolean().optional(),
  enable_crypto_funding: z.boolean().optional(),
  enable_crypto_payouts: z.boolean().optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const flags = await services.settings.getFeatureFlags();
    return NextResponse.json(flags);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid feature flag payload.");

    await services.settings.updateFeatureFlags(parsed.data, reviewer.id);
    await services.audit.log({
      actorId: reviewer.id,
      action: "settings.feature_flags_updated",
      entityType: "settings",
      metadata: parsed.data
    });

    const flags = await services.settings.getFeatureFlags();
    return NextResponse.json(flags);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
