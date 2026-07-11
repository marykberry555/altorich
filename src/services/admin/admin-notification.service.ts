import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type AdminNotificationRow = Database["public"]["Tables"]["admin_notifications"]["Row"];

export class AdminNotificationService {
  constructor(private readonly supabase: Client) {}

  async list(limit = 40, unreadOnly = false) {
    let query = this.supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.is("read_at", null);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async markRead(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await this.supabase
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    if (error) throw error;
  }

  async unreadCount() {
    const { count, error } = await this.supabase
      .from("admin_notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null);
    if (error) throw error;
    return count ?? 0;
  }
}

export class AdminPushSubscriptionService {
  constructor(private readonly supabase: Client) {}

  async upsert(input: {
    adminUserId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string;
  }) {
    const { error } = await this.supabase.from("admin_push_subscriptions").upsert(
      {
        admin_user_id: input.adminUserId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        user_agent: input.userAgent ?? null
      },
      { onConflict: "admin_user_id,endpoint" }
    );
    if (error) throw error;
  }
}
