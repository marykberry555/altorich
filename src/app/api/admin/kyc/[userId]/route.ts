import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminServices } from "@/lib/services";
import { requireAdmin } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";

type Context = { params: Promise<{ userId: string }> };

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected", "requires_update"]),
  rejectionReason: z.string().optional()
});

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const reviewer = await requireAdmin();
    const services = await getAdminServices();
    if (!services) throw Errors.forbidden();

    const { userId } = await context.params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid KYC review payload.");

    await services.kyc.review({
      userId,
      reviewerId: reviewer.id,
      status: parsed.data.status,
      rejectionReason: parsed.data.rejectionReason
        ? sanitizeText(parsed.data.rejectionReason, 500)
        : undefined
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
