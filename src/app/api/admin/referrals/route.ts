import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";
import type { ReferralProgramConfig } from "@/lib/referral/config";

const configSchema = z.object({
  enabled: z.boolean().optional(),
  milestone_bonuses_enabled: z.boolean().optional(),
  recurring_commissions_enabled: z.boolean().optional(),
  min_payout_threshold: z.number().min(0).optional(),
  commission_by_package: z
    .object({
      starter: z.number().min(0).max(100).optional(),
      growth: z.number().min(0).max(100).optional(),
      elite: z.number().min(0).max(100).optional(),
      premium: z.number().min(0).max(100).optional()
    })
    .optional()
});

const vipSchema = z.object({
  level: z.number().int().min(0).max(10),
  label: z.string().min(1).optional(),
  min_members: z.number().int().min(0).optional(),
  commission_percent: z.number().min(0).max(100).optional(),
  milestone_bonus: z.number().min(0).optional(),
  perks: z.array(z.string()).optional()
});

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const [config, vipLevels, analytics, pendingPayouts] = await Promise.all([
      services.referrals.getProgramConfig(),
      services.referrals.listVipLevels(),
      services.referrals.getAdminAnalytics(),
      services.referrals.listPendingPayouts()
    ]);

    return NextResponse.json({ config, vipLevels, analytics, pendingPayouts });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const body = await request.json();

    if (body.config) {
      const parsed = configSchema.safeParse(body.config);
      if (!parsed.success) throw Errors.badRequest("Invalid referral programme config.");
      await services.referrals.updateProgramConfig(parsed.data as Partial<ReferralProgramConfig>);
    }

    if (Array.isArray(body.vipLevels)) {
      for (const row of body.vipLevels) {
        const parsed = vipSchema.safeParse(row);
        if (!parsed.success) continue;
        await services.referrals.updateVipLevel(parsed.data.level, parsed.data);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
