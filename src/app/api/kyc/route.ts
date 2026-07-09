import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { apiErrorResponse, Errors } from "@/lib/errors";
import { sanitizeText } from "@/lib/security/sanitize";

const submitSchema = z.object({
  documentType: z.enum(["government_id", "selfie", "proof_of_address"]),
  storagePath: z.string().min(3),
  bvnReference: z.string().optional(),
  ninReference: z.string().optional()
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();

    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();

    const kyc = await services.kyc.getProfileKyc(user.id);
    return NextResponse.json(kyc);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();

    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();

    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) throw Errors.badRequest("Invalid KYC payload.");

    const { documentType, storagePath, bvnReference, ninReference } = parsed.data;

    const doc = await services.kyc.submitDocument({
      userId: user.id,
      documentType,
      storagePath: sanitizeText(storagePath, 300)
    });

    if (bvnReference || ninReference) {
      await services.kyc.updateIdentityReferences(user.id, {
        bvnReference: bvnReference ? sanitizeText(bvnReference, 50) : undefined,
        ninReference: ninReference ? sanitizeText(ninReference, 50) : undefined
      });
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
