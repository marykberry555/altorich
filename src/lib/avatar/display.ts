import { getInitials } from "@/lib/utils/avatar";

export { getInitials };

export const AVATAR_UPDATED_EVENT = "altorich:avatar-updated";


const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

/** Prefer MIME over filename so iOS "image" / "blob" uploads get a stable path. */
export function avatarExtensionFromMime(mimeType: string, fileName?: string): string {
  const fromMime = MIME_TO_EXT[mimeType];
  if (fromMime) return fromMime;
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
}

/** Stable public URL with a version query so replacements are not stuck behind CDN/browser cache. */
export function withAvatarCacheBust(publicUrl: string, version: string | number = Date.now()): string {
  const base = publicUrl.split("?")[0] ?? publicUrl;
  return `${base}?v=${encodeURIComponent(String(version))}`;
}

export function stripAvatarCacheBust(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.split("?")[0] ?? url;
}

/**
 * Compress / resize an image client-side before upload.
 * Keeps uploads under the 2MB avatars bucket limit and speeds mobile uploads.
 */
export async function compressImageForAvatar(file: File, maxEdge = 512, quality = 0.82): Promise<File> {
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/jpeg", quality);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg", lastModified: Date.now() });
}
