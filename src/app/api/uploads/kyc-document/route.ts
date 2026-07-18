import { NextRequest, NextResponse } from "next/server";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { sanitizeFilename } from "@/lib/security/sanitize";

const ALLOWED_TYPES = ["government_id", "selfie", "proof_of_address"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) throw Errors.unauthorized();

    const services = await getUserServices();
    if (!services) throw Errors.notConfigured();

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = String(formData.get("documentType") ?? "");

    if (!(file instanceof File)) throw Errors.badRequest("File is required.");
    if (!ALLOWED_TYPES.includes(documentType as (typeof ALLOWED_TYPES)[number])) {
      throw Errors.badRequest("Invalid document type.");
    }
    if (file.size > MAX_BYTES) throw Errors.badRequest("File exceeds 5MB limit.");
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      throw Errors.badRequest("Only JPEG, PNG, WebP, or PDF files are allowed.");
    }

    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] ?? "bin";
    const path = `kyc/${user.id}/${documentType}-${Date.now()}.${sanitizeFilename(ext)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await services.supabase.storage
      .from("kyc-documents")
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const doc = await services.kyc.submitDocument({
      userId: user.id,
      documentType: documentType as (typeof ALLOWED_TYPES)[number],
      storagePath: path
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
