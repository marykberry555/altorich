import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { AppError } from "@/lib/errors";
import { NotificationService } from "@/services/notification/notification.service";
import { AuditService } from "@/services/audit/audit.service";

type Client = SupabaseClient<Database>;
export type KycStatus = Database["public"]["Enums"]["kyc_status"];

export class KycService {
  private readonly notifications: NotificationService;
  private readonly audit: AuditService;

  constructor(private readonly supabase: Client) {
    this.notifications = new NotificationService(supabase);
    this.audit = new AuditService(supabase);
  }

  async getProfileKyc(userId: string) {
    const { data: profile, error } = await this.supabase
      .from("profiles")
      .select("kyc_status, kyc_reviewed_at, kyc_rejection_reason, bvn_reference, nin_reference")
      .eq("id", userId)
      .single();

    if (error) throw error;

    const { data: documents } = await this.supabase
      .from("kyc_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { profile, documents: documents ?? [] };
  }

  async isWithdrawalAllowed(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data: flagRow } = await this.supabase.from("settings").select("value").eq("key", "feature_flags").maybeSingle();
    const kycRequired = Boolean((flagRow?.value as { kyc_required?: boolean } | null)?.kyc_required);

    if (!kycRequired) return { allowed: true };

    const { data: profile } = await this.supabase
      .from("profiles")
      .select("kyc_status")
      .eq("id", userId)
      .single();

    const status = profile?.kyc_status ?? "pending";
    if (status === "approved") return { allowed: true };

    return {
      allowed: false,
      reason:
        status === "rejected"
          ? "Identity verification was rejected. Contact support for assistance."
          : status === "requires_update"
            ? "Additional verification is required before withdrawals."
            : "Identity verification is required before requesting a withdrawal."
    };
  }

  async submitDocument(input: {
    userId: string;
    documentType: "government_id" | "selfie" | "proof_of_address";
    storagePath: string;
    metadata?: Record<string, unknown>;
  }) {
    const { data, error } = await this.supabase
      .from("kyc_documents")
      .insert({
        user_id: input.userId,
        document_type: input.documentType,
        storage_path: input.storagePath,
        status: "pending",
        metadata: (input.metadata ?? {}) as Json
      })
      .select()
      .single();

    if (error) throw error;

    await this.supabase
      .from("profiles")
      .update({ kyc_status: "pending", kyc_rejection_reason: null })
      .eq("id", input.userId);

    await this.audit.log({
      actorId: input.userId,
      action: "kyc.document_submitted",
      entityType: "kyc_document",
      entityId: data.id,
      metadata: { document_type: input.documentType }
    });

    return data;
  }

  async updateIdentityReferences(userId: string, input: { bvnReference?: string; ninReference?: string }) {
    const { error } = await this.supabase
      .from("profiles")
      .update({
        bvn_reference: input.bvnReference ?? null,
        nin_reference: input.ninReference ?? null
      })
      .eq("id", userId);

    if (error) throw error;
  }

  async review(input: {
    userId: string;
    reviewerId: string;
    status: KycStatus;
    rejectionReason?: string;
  }) {
    if (!["approved", "rejected", "requires_update"].includes(input.status)) {
      throw new AppError("Invalid KYC review status.", 400, "INVALID_STATUS");
    }

    const { error: profileError } = await this.supabase
      .from("profiles")
      .update({
        kyc_status: input.status,
        kyc_reviewed_at: new Date().toISOString(),
        kyc_rejection_reason: input.rejectionReason ?? null
      })
      .eq("id", input.userId);

    if (profileError) throw profileError;

    await this.supabase
      .from("kyc_documents")
      .update({
        status: input.status === "approved" ? "approved" : input.status === "rejected" ? "rejected" : "pending",
        reviewed_by: input.reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: input.rejectionReason ?? null
      })
      .eq("user_id", input.userId)
      .eq("status", "pending");

    const title =
      input.status === "approved"
        ? "KYC approved"
        : input.status === "requires_update"
          ? "KYC update required"
          : "KYC rejected";

    const body =
      input.status === "approved"
        ? "Your identity verification is complete. Withdrawals are now available."
        : input.rejectionReason ?? "Please review your KYC submission in your profile.";

    await this.notifications.dispatch({
      userId: input.userId,
      title,
      body,
      channel: "in_app",
      metadata: { kyc_status: input.status }
    });

    await this.audit.log({
      actorId: input.reviewerId,
      action: "kyc.reviewed",
      entityType: "profile",
      entityId: input.userId,
      metadata: { status: input.status, reason: input.rejectionReason }
    });
  }
}
