import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export type AuditLogFilters = {
  limit?: number;
  offset?: number;
  action?: string;
  entityType?: string;
  actorId?: string;
  /** Member profile UUID — matches entity_id or metadata text containing the id. */
  memberId?: string;
  /** Settlement / deposit reference — matches metadata.reference or metadata text. */
  settlementReference?: string;
  from?: string;
  to?: string;
  q?: string;
};

export type EnrichedAuditLog = AuditLogRow & {
  actor_name: string | null;
  reference: string | null;
};

function metadataReference(metadata: Json): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const ref = (metadata as Record<string, unknown>).reference;
  return typeof ref === "string" && ref.trim() ? ref : null;
}

export class AuditService {
  constructor(private readonly supabase: Client) {}

  async log(input: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    const { error } = await this.supabase.from("audit_logs").insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as Json,
      ip_address: input.ipAddress ?? null
    });

    if (error) throw error;
  }

  async list(input?: AuditLogFilters): Promise<EnrichedAuditLog[]> {
    const limit = Math.min(Math.max(input?.limit ?? 100, 1), 500);
    const offset = Math.max(input?.offset ?? 0, 0);

    let query = this.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (input?.action) query = query.ilike("action", `%${input.action}%`);
    if (input?.entityType) query = query.eq("entity_type", input.entityType);
    if (input?.actorId) query = query.eq("actor_id", input.actorId);
    if (input?.from) query = query.gte("created_at", input.from);
    if (input?.to) query = query.lte("created_at", input.to);

    if (input?.settlementReference?.trim()) {
      const ref = input.settlementReference.trim();
      query = query.or(`metadata->>reference.ilike.%${ref}%,metadata::text.ilike.%${ref}%`);
    }

    if (input?.memberId?.trim()) {
      const memberId = input.memberId.trim();
      const relatedIds = await this.relatedEntityIdsForMember(memberId);
      const parts = [
        `entity_id.eq.${memberId}`,
        `metadata->>user_id.eq.${memberId}`,
        `metadata::text.ilike.%${memberId}%`
      ];
      if (relatedIds.length > 0) {
        parts.push(`entity_id.in.(${relatedIds.join(",")})`);
      }
      query = query.or(parts.join(","));
    }

    if (input?.q?.trim()) {
      const q = input.q.trim();
      query = query.or(
        `action.ilike.%${q}%,entity_type.ilike.%${q}%,entity_id.ilike.%${q}%,metadata::text.ilike.%${q}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const actorIds = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
    const nameById = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: profiles } = await this.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);
      for (const p of profiles ?? []) nameById.set(p.id, p.full_name);
    }

    return rows.map((row) => ({
      ...row,
      actor_name: row.actor_id ? (nameById.get(row.actor_id) ?? null) : null,
      reference: metadataReference(row.metadata)
    }));
  }

  private async relatedEntityIdsForMember(memberId: string): Promise<string[]> {
    const [deposits, withdrawals, payouts] = await Promise.all([
      this.supabase.from("deposits").select("id").eq("user_id", memberId).limit(200),
      this.supabase.from("withdrawals").select("id").eq("user_id", memberId).limit(200),
      this.supabase.from("referral_payouts").select("id").eq("user_id", memberId).limit(200)
    ]);
    return [
      ...(deposits.data ?? []).map((r) => String(r.id)),
      ...(withdrawals.data ?? []).map((r) => String(r.id)),
      ...(payouts.data ?? []).map((r) => String((r as { id: string }).id))
    ];
  }
}
