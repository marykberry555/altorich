import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { STORAGE_BUCKETS } from "@/services/storage/storage.service";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser();
    const services = await getServiceRoleServices();
    if (!services) throw Errors.notConfigured();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw Errors.badRequest("File is required.");
    }

    services.storage.validateUpload(STORAGE_BUCKETS.avatars, { size: file.size, type: file.type });

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const buffer = await file.arrayBuffer();

    await services.storage.upload(STORAGE_BUCKETS.avatars, path, buffer, file.type);
    const publicUrl = await services.storage.getPublicUrl(STORAGE_BUCKETS.avatars, path);

    const { error } = await services.supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (error) throw error;

    logger.info("Avatar uploaded", { userId: user.id });
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
