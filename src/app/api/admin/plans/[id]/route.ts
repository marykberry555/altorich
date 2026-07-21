import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { sanitizeText } from "@/lib/security/sanitize";
import type { Database } from "@/types/database";
import { platformProjectedDaily } from "@/lib/earning/platform-earning";
import { assertNoMaxInvestmentInBody, toPublicInvestmentPlan } from "@/lib/packages/public-plan";
import {
  getPortfolioBySlug,
  getPortfolioWeeklyRoiBps,
  isPortfolioSlug,
  resolveWeeklyRoiBps,
  type PortfolioSlug
} from "@/config/investment-portfolios";

type Context = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  plan_status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  min_investment: z.number().positive().optional(),
  projected_daily: z.number().nonnegative().optional(),
  cycle_days: z.number().int().positive().optional(),
  description: z.string().min(10).optional(),
  visibility: z.enum(["public", "members", "hidden"]).optional()
  // max_investment / weekly_roi_bps owned by portfolio config (synced on update)
});

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const reviewer = await requireAdmin();
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const { id } = await context.params;
    const body = await request.json();
    assertNoMaxInvestmentInBody(body);

    const existing = await services.supabase
      .from("investment_plans")
      .select("tier, min_investment")
      .eq("id", id)
      .maybeSingle();
    const planTier = (existing.data?.tier ?? "starter") as PortfolioSlug;

    const parsed = updateSchema.safeParse({
      ...body,
      sort_order: body.sort_order !== undefined ? Number(body.sort_order) : undefined,
      min_investment: body.min_investment !== undefined ? Number(body.min_investment) : undefined,
      projected_daily: body.projected_daily !== undefined ? Number(body.projected_daily) : undefined,
      cycle_days: body.cycle_days !== undefined ? Number(body.cycle_days) : undefined
    });

    if (!parsed.success) throw Errors.badRequest("Invalid plan update.");

    const update: Database["public"]["Tables"]["investment_plans"]["Update"] = {};
    if (parsed.data.name) update.name = sanitizeText(parsed.data.name, 120);
    if (parsed.data.plan_status) update.plan_status = parsed.data.plan_status;
    if (parsed.data.is_active !== undefined) update.is_active = parsed.data.is_active;
    if (parsed.data.sort_order !== undefined) update.sort_order = parsed.data.sort_order;
    if (parsed.data.min_investment !== undefined) update.min_investment = parsed.data.min_investment;
    // Keep plan ceilings aligned with centralized portfolio config.
    const portfolio = isPortfolioSlug(planTier) ? getPortfolioBySlug(planTier) : undefined;
    update.max_investment = portfolio?.maximumInvestment ?? null;
    // Sync ROI fields from centralized portfolio config for this tier.
    update.weekly_roi_bps = isPortfolioSlug(planTier)
      ? getPortfolioWeeklyRoiBps(planTier)
      : resolveWeeklyRoiBps({
          slug: planTier,
          amountNgn: Number(parsed.data.min_investment ?? existing.data?.min_investment ?? 0)
        });
    if (parsed.data.min_investment !== undefined) {
      update.projected_daily = isPortfolioSlug(planTier)
        ? platformProjectedDaily(parsed.data.min_investment, planTier)
        : platformProjectedDaily(parsed.data.min_investment);
    } else if (portfolio) {
      update.projected_daily = platformProjectedDaily(portfolio.minimumInvestment, planTier);
    } else if (parsed.data.projected_daily !== undefined) {
      update.projected_daily = parsed.data.projected_daily;
    }
    if (parsed.data.cycle_days !== undefined) update.cycle_days = parsed.data.cycle_days;
    if (parsed.data.description) update.description = sanitizeText(parsed.data.description, 2000);
    if (parsed.data.visibility) update.visibility = parsed.data.visibility;

    const { data, error } = await services.supabase
      .from("investment_plans")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await services.audit.log({
      actorId: reviewer.id,
      action: "plan.updated",
      entityType: "investment_plan",
      entityId: id,
      metadata: parsed.data as Record<string, unknown>
    });

    return NextResponse.json(toPublicInvestmentPlan(data));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const reviewer = await requireAdmin();
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const { id } = await context.params;
    await services.investments.deletePlan(id);

    await services.audit.log({
      actorId: reviewer.id,
      action: "plan.deleted",
      entityType: "investment_plan",
      entityId: id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
