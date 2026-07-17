import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AppError, Errors } from "@/lib/errors";
import { WalletService } from "@/services/wallet/wallet.service";
import { NotificationService } from "@/services/notification/notification.service";
import { AuditService } from "@/services/audit/audit.service";
import { logger } from "@/lib/logger";

type Client = SupabaseClient<Database>;

export type CapitalLiquidationRequest = {
  id: string;
  investment_id: string;
  user_id: string;
  principal_amount: number;
  reason: string;
  comments: string | null;
  status: "pending" | "approved" | "rejected" | "more_info";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export class CapitalLiquidationService {
  private readonly wallet: WalletService;
  private readonly notifications: NotificationService;
  private readonly audit: AuditService;

  constructor(private readonly supabase: Client) {
    this.wallet = new WalletService(supabase);
    this.notifications = new NotificationService(supabase);
    this.audit = new AuditService(supabase);
  }

  async listPending(limit = 50): Promise<CapitalLiquidationRequest[]> {
    const { data, error } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as unknown as CapitalLiquidationRequest[];
  }

  async listForUser(userId: string, limit = 20): Promise<CapitalLiquidationRequest[]> {
    const { data, error } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as unknown as CapitalLiquidationRequest[];
  }

  async request(input: {
    investmentId: string;
    userId: string;
    reason: string;
    comments?: string;
  }) {
    const reason = input.reason.trim();
    if (reason.length < 3) {
      throw new AppError("Please provide a reason for capital liquidation.", 400, "INVALID_REASON");
    }

    const { data: inv, error } = await this.supabase
      .from("investments")
      .select("*")
      .eq("id", input.investmentId)
      .eq("user_id", input.userId)
      .single();

    if (error || !inv) throw Errors.notFound("Investment");
    if (!["active", "stopping", "stopped"].includes(inv.status)) {
      throw new AppError("Only active investments can request capital liquidation.", 409, "INVALID_STATUS");
    }

    const { data: existing } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .select("id")
      .eq("investment_id", input.investmentId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      throw new AppError("A capital liquidation request is already pending for this investment.", 409, "ALREADY_PENDING");
    }

    const { data, error: insertError } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .insert({
        investment_id: input.investmentId,
        user_id: input.userId,
        principal_amount: Number(inv.amount),
        reason,
        comments: input.comments?.trim() || null,
        status: "pending"
      } as never)
      .select()
      .single();

    if (insertError) throw insertError;

    await this.notifications.notifyEvent("liquidation.requested", input.userId, {
      amount: Number(inv.amount),
      investment_id: input.investmentId
    });

    await this.audit.log({
      actorId: input.userId,
      action: "capital_liquidation.requested",
      entityType: "investment",
      entityId: input.investmentId,
      metadata: { request_id: (data as { id: string }).id, reason }
    });

    return data as unknown as CapitalLiquidationRequest;
  }

  async approve(requestId: string, reviewerId: string, adminNote?: string) {
    const request = await this.getById(requestId);
    if (request.status !== "pending" && request.status !== "more_info") {
      throw new AppError("Request is not awaiting review.", 409, "INVALID_STATUS");
    }

    const { data: inv, error: invError } = await this.supabase
      .from("investments")
      .select("*")
      .eq("id", request.investment_id)
      .single();

    if (invError || !inv) throw Errors.notFound("Investment");

    const principal = Number(inv.amount);
    const wallet = await this.wallet.getWalletByUserId(request.user_id);
    await this.wallet.postTransaction({
      walletId: wallet.id,
      type: "credit",
      amount: principal,
      reference: `CAP-LIQ-${requestId}`,
      reason: "adjustment",
      metadata: {
        capital_liquidation_request_id: requestId,
        investment_id: inv.id,
        kind: "capital_liquidation"
      }
    });

    await this.supabase
      .from("investments")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        amount: 0
      } as Database["public"]["Tables"]["investments"]["Update"])
      .eq("id", inv.id);

    const { data, error } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .update({
        status: "approved",
        admin_note: adminNote?.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;

    await this.notifications.notifyEvent("liquidation.approved", request.user_id, {
      amount: principal,
      investment_id: inv.id
    });

    await this.audit.log({
      actorId: reviewerId,
      action: "capital_liquidation.approved",
      entityType: "investment",
      entityId: inv.id,
      metadata: { request_id: requestId, principal }
    });

    return data as unknown as CapitalLiquidationRequest;
  }

  async reject(requestId: string, reviewerId: string, adminNote: string) {
    const request = await this.getById(requestId);
    if (request.status !== "pending" && request.status !== "more_info") {
      throw new AppError("Request is not awaiting review.", 409, "INVALID_STATUS");
    }

    const note = adminNote.trim() || "Your capital liquidation request was not approved.";

    const { data, error } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .update({
        status: "rejected",
        admin_note: note,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;

    await this.notifications.notifyEvent("liquidation.rejected", request.user_id, {
      amount: Number(request.principal_amount),
      reason: note,
      investment_id: request.investment_id
    });

    await this.audit.log({
      actorId: reviewerId,
      action: "capital_liquidation.rejected",
      entityType: "investment",
      entityId: request.investment_id,
      metadata: { request_id: requestId, note }
    });

    return data as unknown as CapitalLiquidationRequest;
  }

  async requestMoreInfo(requestId: string, reviewerId: string, adminNote: string) {
    const request = await this.getById(requestId);
    if (request.status !== "pending") {
      throw new AppError("Only pending requests can ask for more information.", 409, "INVALID_STATUS");
    }

    const note = adminNote.trim();
    if (!note) throw new AppError("Admin note is required.", 400, "INVALID_NOTE");

    const { data, error } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .update({
        status: "more_info",
        admin_note: note,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq("id", requestId)
      .select()
      .single();

    if (error) throw error;

    await this.notifications.dispatch({
      userId: request.user_id,
      title: "More information needed",
      body: note,
      channel: "in_app",
      metadata: { event: "liquidation.more_info", request_id: requestId }
    });

    return data as unknown as CapitalLiquidationRequest;
  }

  private async getById(requestId: string): Promise<CapitalLiquidationRequest> {
    const { data, error } = await this.supabase
      .from("capital_liquidation_requests" as never)
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !data) throw Errors.notFound("Capital liquidation request");
    return data as unknown as CapitalLiquidationRequest;
  }
}

/** Safe helper when table not yet migrated */
export async function tryListPendingLiquidations(supabase: Client) {
  try {
    return await new CapitalLiquidationService(supabase).listPending();
  } catch (err) {
    logger.warn("Capital liquidation list unavailable", {
      error: err instanceof Error ? err.message : String(err)
    });
    return [];
  }
}
