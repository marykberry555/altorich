import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

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

  async list(input?: { limit?: number; action?: string; entityType?: string }): Promise<AuditLogRow[]> {
    let query = this.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(input?.limit ?? 100);

    if (input?.action) query = query.eq("action", input.action);
    if (input?.entityType) query = query.eq("entity_type", input.entityType);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
}
