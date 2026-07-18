import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleServices } from "@/lib/services";
import { requireSessionUser } from "@/lib/auth/session";
import { Errors } from "@/lib/errors";
import { apiErrorResponse } from "@/lib/errors/api-response";
import { avatarExtensionFromMime, withAvatarCacheBust } from "@/lib/avatar/display";
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

    const ext = avatarExtensionFromMime(file.type, file.name);
    const path = `${user.id}/avatar.${ext}`;
    const buffer = await file.arrayBuffer();
    const version = Date.now();

    // Remove prior avatar objects with other extensions so only one file remains.
    const { data: existing } = await services.supabase.storage.from(STORAGE_BUCKETS.avatars).list(user.id);
    const stale = (existing ?? [])
      .map((item) => item.name)
      .filter((name) => name.startsWith("avatar.") && name !== `avatar.${ext}`)
      .map((name) => `${user.id}/${name}`);
    if (stale.length) {
      await services.supabase.storage.from(STORAGE_BUCKETS.avatars).remove(stale);
    }

    await services.storage.upload(STORAGE_BUCKETS.avatars, path, buffer, file.type);
    const publicUrl = await services.storage.getPublicUrl(STORAGE_BUCKETS.avatars, path);
    const avatarUrl = withAvatarCacheBust(publicUrl, version);

    const { data: updated, error } = await services.supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)
      .select("id, avatar_url")
      .maybeSingle();

    if (error) throw error;
    if (!updated?.avatar_url) {
      throw Errors.badRequest("Could not save profile photo. Please try again.");
    }

    logger.info("Avatar uploaded", { userId: user.id, path, bytes: file.size });
    return NextResponse.json({ url: updated.avatar_url });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
