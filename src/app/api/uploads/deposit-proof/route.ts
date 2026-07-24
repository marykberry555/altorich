import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireDepositUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { STORAGE_BUCKETS } from "@/services/storage/storage.service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireDepositUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw Errors.badRequest("File is required.");
    }

    services.storage.validateUpload(STORAGE_BUCKETS.depositProofs, { size: file.size, type: file.type });

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    await services.storage.upload(STORAGE_BUCKETS.depositProofs, path, buffer, file.type);
    const signedUrl = await services.storage.getSignedUrl(STORAGE_BUCKETS.depositProofs, path, 86400);

    logger.info("Deposit proof uploaded", { userId: user.id, path });
    return NextResponse.json({ path, signedUrl });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
