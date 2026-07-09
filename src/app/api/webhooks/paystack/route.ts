import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { rateLimit, clientIp } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limit = rateLimit(`webhook:paystack:${ip}`, 120, 60_000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    const result = await services.payments.processPaystackWebhook(rawBody, signature);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Paystack webhook failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    return apiErrorResponse(error);
  }
}
