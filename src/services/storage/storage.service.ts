import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError } from "@/lib/errors";

type Client = SupabaseClient<Database>;

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  depositProofs: "deposit-proofs",
  kycDocuments: "kyc-documents"
} as const;

type BucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

const BUCKET_RULES: Record<
  BucketId,
  { maxBytes: number; mimeTypes: readonly string[] }
> = {
  [STORAGE_BUCKETS.avatars]: {
    maxBytes: 2 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"]
  },
  [STORAGE_BUCKETS.depositProofs]: {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"]
  },
  [STORAGE_BUCKETS.kycDocuments]: {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "application/pdf"]
  }
} as const;

export class StorageService {
  constructor(private readonly supabase: Client) {}

  validateUpload(bucket: BucketId, file: { size: number; type: string }) {
    const rules = BUCKET_RULES[bucket];
    if (file.size > rules.maxBytes) {
      throw new AppError(
        `File exceeds maximum size of ${rules.maxBytes / (1024 * 1024)}MB`,
        400,
        "FILE_TOO_LARGE"
      );
    }
    if (!rules.mimeTypes.includes(file.type as (typeof rules.mimeTypes)[number])) {
      throw new AppError("File type not allowed", 400, "INVALID_FILE_TYPE");
    }
  }

  async upload(bucket: BucketId, path: string, file: Buffer | ArrayBuffer, contentType: string) {
    const { data, error } = await this.supabase.storage.from(bucket).upload(path, file, {
      contentType,
      upsert: true
    });

    if (error) throw error;
    return data;
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    const { data, error } = await this.supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  }

  async getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
