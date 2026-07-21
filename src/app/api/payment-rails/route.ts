import { NextResponse } from "next/server";
import { getPublicServices, getServiceRoleServices, getUserServices } from "@/lib/services";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services =
      (await getUserServices()) ?? (await getPublicServices()) ?? (await getServiceRoleServices());
    if (!services) throw Errors.notConfigured();
    const snapshot = await services.paymentRails.getPublicSnapshot();
    return NextResponse.json(snapshot);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
