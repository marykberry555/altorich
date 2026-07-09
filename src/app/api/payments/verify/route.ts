import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = rateLimit(`payments:verify:${ip}`, 30, 60_000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) throw Errors.badRequest("Payment reference is required.");

    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();

    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const { data: payment } = await services.supabase
      .from("payment_transactions")
      .select("user_id")
      .eq("reference", reference)
      .maybeSingle();

    if (!payment || payment.user_id !== user.id) {
      throw Errors.notFound("Payment");
    }

    const result = await services.payments.verifyAndCredit(reference, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
