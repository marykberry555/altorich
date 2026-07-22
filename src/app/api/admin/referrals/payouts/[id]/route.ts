import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireFinanceAdmin } from "@/lib/auth/finance-auth";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "paid"]),
  rejectionReason: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = enforceRateLimit(request, "adminFinanceAction");
    if (limited) return limited;

    const user = await requireFinanceAdmin("referral.payout.review");
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const { id } = await params;
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid withdrawal action.");

    const payout = await services.referrals.reviewPayout(
      id,
      parsed.data.action,
      user.id,
      parsed.data.rejectionReason
    );

    await services.audit.log({
      actorId: user.id,
      action: `referral.payout.${parsed.data.action}`,
      entityType: "referral_payout",
      entityId: id,
      metadata: { rejectionReason: parsed.data.rejectionReason }
    });

    return NextResponse.json(payout);
  } catch (error) {
    return apiErrorResponse(error, { route: "/api/admin/referrals/payouts/[id]" });
  }
}
