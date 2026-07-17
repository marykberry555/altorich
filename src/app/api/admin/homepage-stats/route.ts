import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { mergeHomepageStats } from "@/lib/homepage/homepage-stats";
import { getServiceRoleServices } from "@/lib/services";

const payloadSchema = z.object({
  verifiedMembers: z.number().int().min(0).max(100_000_000).optional(),
  verifiedMembersSuffix: z.string().max(8).optional(),
  verifiedMembersLabel: z.string().max(80).optional(),
  verifiedMembersDailyGrowth: z.number().int().min(0).max(1_000_000).optional(),
  membersGrowthEpoch: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  transactedTodayStart: z.number().int().min(0).max(1_000_000_000_000).optional(),
  transactedTodayTarget: z.number().int().min(0).max(1_000_000_000_000).optional(),
  transactedTodayMax: z.number().int().min(0).max(1_000_000_000_000).optional(),
  transactedDailyFloorGrowth: z.number().int().min(0).max(1_000_000_000_000).optional(),
  transactedTodayLabel: z.string().max(80).optional(),
  transactedTodaySuffix: z.string().max(8).optional(),
  memberSatisfactionPercent: z.number().min(0).max(100).optional(),
  memberSatisfactionLabel: z.string().max(80).optional(),
  platformAvailabilityPercent: z.number().min(0).max(100).optional(),
  platformAvailabilityLabel: z.string().max(80).optional(),
  platformAvailabilitySupport: z.string().max(160).optional(),
  wealthGrowthStart: z.number().int().min(1).max(1_000_000_000_000).optional(),
  wealthGrowthTarget: z.number().int().min(1).max(1_000_000_000_000).optional(),
  wealthGrowthSpeed: z.number().min(0.25).max(4).optional(),
  wealthGrowthHeadline: z.string().max(120).optional(),
  wealthGrowthDescription: z.string().max(400).optional(),
  wealthGrowthSupport: z.string().max(200).optional(),
  calculatorMinInvestment: z.number().int().min(0).max(100_000_000).optional(),
  calculatorDailyRatePercent: z.number().min(0).max(100).optional(),
  calculatorWeeklyRatePercent: z.number().min(0).max(1000).optional(),
  calculatorTitle: z.string().max(120).optional(),
  calculatorDescription: z.string().max(400).optional(),
  calculatorDisclaimer: z.string().max(400).optional(),
  opsGraphSpeed: z.number().min(0.25).max(3).optional(),
  opsGraphBaseline: z.number().min(0.05).max(0.9).optional(),
  opsGraphFluctuation: z.number().min(0.01).max(0.25).optional(),
  opsStatusLabel: z.string().max(40).optional(),
  opsHeadline: z.string().max(80).optional(),
  opsDescription: z.string().max(300).optional(),
  resetHourLagos: z.number().int().min(0).max(23).optional(),
  resetMinuteLagos: z.number().int().min(0).max(59).optional()
});

export async function GET() {
  try {
    await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();
    const stats = await services.settings.getHomepageStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid homepage stats payload.");

    const next = await services.settings.updateHomepageStats(parsed.data, admin.id);
    await services.audit.log({
      actorId: admin.id,
      action: "settings.homepage_stats_updated",
      entityType: "settings",
      metadata: { keys: Object.keys(parsed.data) }
    });

    return NextResponse.json({ stats: mergeHomepageStats(next) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
