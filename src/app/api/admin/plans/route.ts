import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";

const planSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  tier: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  min_investment: z.number().positive(),
  max_investment: z.number().positive(),
  cycle_days: z.number().int().positive(),
  projected_daily: z.number().nonnegative(),
  first_bonus: z.number().nonnegative().default(0),
  description: z.string().min(10),
  settlement_frequency: z.enum(["daily", "weekly", "monthly", "maturity"]),
  plan_status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
  visibility: z.enum(["public", "members", "hidden"]).default("members"),
  is_active: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  risk_disclosure: z.string().min(10)
});

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();
    const plans = await services.investments.listAllPlans();
    return NextResponse.json(plans);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await requireAdmin();
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const body = await request.json();
    const parsed = planSchema.safeParse({
      ...body,
      price: Number(body.price),
      min_investment: Number(body.min_investment),
      max_investment: Number(body.max_investment),
      cycle_days: Number(body.cycle_days),
      projected_daily: Number(body.projected_daily),
      first_bonus: Number(body.first_bonus ?? 0),
      sort_order: Number(body.sort_order ?? 0)
    });

    if (!parsed.success) throw Errors.badRequest("Invalid plan payload.");

    const input = parsed.data;
    const plan = await services.investments.upsertPlan({
      slug: sanitizeText(input.slug, 80),
      name: sanitizeText(input.name, 120),
      tier: sanitizeText(input.tier, 40),
      category: sanitizeText(input.category, 40),
      price: input.price,
      min_investment: input.min_investment,
      max_investment: input.max_investment,
      currency: "NGN",
      cycle_days: input.cycle_days,
      projected_daily: input.projected_daily,
      first_bonus: input.first_bonus,
      description: sanitizeText(input.description, 2000),
      settlement_frequency: input.settlement_frequency,
      plan_status: input.plan_status,
      visibility: input.visibility,
      is_active: input.is_active,
      sort_order: input.sort_order,
      risk_disclosure: sanitizeText(input.risk_disclosure, 2000)
    });

    await services.audit.log({
      actorId: reviewer.id,
      action: "plan.created",
      entityType: "investment_plan",
      entityId: plan.id,
      metadata: { slug: plan.slug, name: plan.name }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
