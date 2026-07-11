import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";

const createPlanSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  tier: z.enum(["starter", "growth", "premium", "elite"]),
  min_investment: z.number().positive(),
  max_investment: z.number().positive().optional()
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
    const parsed = createPlanSchema.safeParse({
      ...body,
      name: typeof body.name === "string" ? sanitizeText(body.name, 120) : undefined,
      min_investment: Number(body.min_investment),
      max_investment: body.max_investment !== undefined && body.max_investment !== "" ? Number(body.max_investment) : undefined
    });

    if (!parsed.success) throw Errors.badRequest("Enter a tier and valid investment amounts.");

    const plan = await services.investments.createPlan(parsed.data);

    await services.audit.log({
      actorId: reviewer.id,
      action: "plan.created",
      entityType: "investment_plan",
      entityId: plan.id,
      metadata: { slug: plan.slug, name: plan.name, tier: plan.tier }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
