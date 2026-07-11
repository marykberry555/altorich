import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "paid"]),
  rejectionReason: z.string().optional()
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const { id } = await params;
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid payout action.");

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
    return apiErrorResponse(error);
  }
}
