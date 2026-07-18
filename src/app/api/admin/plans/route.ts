import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { sanitizeText } from "@/lib/security/sanitize";
import { assertNoMaxInvestmentInBody, toPublicInvestmentPlans, toPublicInvestmentPlan } from "@/lib/packages/public-plan";

const createPlanSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  tier: z.enum(["starter", "growth", "premium", "elite"]),
  min_investment: z.number().positive()
  // max_investment intentionally omitted — sectors have unlimited principal
});

export async function GET() {
  try {
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();
    const plans = await services.investments.listAllPlans();
    return NextResponse.json(toPublicInvestmentPlans(plans));
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
    assertNoMaxInvestmentInBody(body);

    const parsed = createPlanSchema.safeParse({
      ...body,
      name: typeof body.name === "string" ? sanitizeText(body.name, 120) : undefined,
      min_investment: Number(body.min_investment)
    });

    if (!parsed.success) throw Errors.badRequest("Enter a sector and valid minimum entry amount.");

    const plan = await services.investments.createPlan(parsed.data);

    await services.audit.log({
      actorId: reviewer.id,
      action: "plan.created",
      entityType: "investment_plan",
      entityId: plan.id,
      metadata: { slug: plan.slug, name: plan.name, tier: plan.tier }
    });

    return NextResponse.json(toPublicInvestmentPlan(plan), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
