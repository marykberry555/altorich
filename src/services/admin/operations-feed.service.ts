import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { OperationsFeedCategory, OperationsFeedEvent } from "@/lib/admin-ops/types";

type Client = SupabaseClient<Database>;

type WelcomeBonusFeedRow = {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  allocation_number: number;
  created_at: string;
};

export class OperationsFeedService {
  constructor(private readonly supabase: Client) {}

  async getFeed(input: {
    limit?: number;
    category?: OperationsFeedCategory;
    q?: string;
  }): Promise<OperationsFeedEvent[]> {
    const limit = input.limit ?? 50;
    const perSource = Math.ceil(limit / 4);
    const events: OperationsFeedEvent[] = [];

    const [deposits, withdrawals, profiles, audits] = await Promise.all([
      this.supabase
        .from("deposits")
        .select("id, user_id, member_name, amount, status, reference, created_at")
        .order("created_at", { ascending: false })
        .limit(perSource),
      this.supabase
        .from("withdrawals")
        .select("id, user_id, amount, status, bank_name, settlement_reference, created_at")
        .order("created_at", { ascending: false })
        .limit(perSource),
      this.supabase
        .from("profiles")
        .select("id, full_name, username, email_verified_at, created_at")
        .order("created_at", { ascending: false })
        .limit(perSource),
      this.supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(perSource)
    ]);

    const bonusResult = await (this.supabase as SupabaseClient<Record<string, unknown>>)
        .from("welcome_bonuses")
        .select("id, user_id, amount, status, allocation_number, created_at")
        .order("created_at", { ascending: false })
        .limit(Math.max(5, Math.floor(perSource / 2)));

    const bonusRows = (bonusResult.data ?? []) as WelcomeBonusFeedRow[];

    for (const d of deposits.data ?? []) {
      const kind =
        d.status === "pending"
          ? "deposit_submitted"
          : d.status === "approved" || d.status === "completed"
            ? "deposit_approved"
            : "deposit_updated";
      events.push({
        id: `dep-${d.id}`,
        category: "deposits",
        kind,
        title:
          kind === "deposit_submitted"
            ? "Deposit submitted"
            : kind === "deposit_approved"
              ? "Deposit approved"
              : `Deposit ${d.status}`,
        description: `${d.member_name ?? "Member"} · ₦${Number(d.amount).toLocaleString("en-NG")}${d.reference ? ` · ${d.reference}` : ""}`,
        entityId: d.id,
        href: adminAppPath("/deposits"),
        at: d.created_at
      });
    }

    for (const w of withdrawals.data ?? []) {
      const kind = w.status === "pending" || w.status === "scheduled" ? "withdrawal_requested" : "withdrawal_updated";
      events.push({
        id: `wd-${w.id}`,
        category: "withdrawals",
        kind: w.status === "paid" || w.status === "approved" ? "withdrawal_approved" : kind,
        title:
          w.status === "paid"
            ? "Withdrawal paid"
            : w.status === "approved"
              ? "Withdrawal approved"
              : "Withdrawal requested",
        description: `₦${Number(w.amount).toLocaleString("en-NG")} · ${w.bank_name ?? "Bank"}${w.settlement_reference ? ` · ${w.settlement_reference}` : ""}`,
        entityId: w.id,
        href: adminAppPath("/payouts"),
        at: w.created_at
      });
    }

    for (const p of profiles.data ?? []) {
      events.push({
        id: `mem-${p.id}`,
        category: "members",
        kind: "member_registered",
        title: "Member registered",
        description: p.full_name ?? p.username ?? p.id.slice(0, 8),
        entityId: p.id,
        href: adminAppPath(`/members/${p.id}`),
        at: p.created_at
      });
      if (p.email_verified_at) {
        events.push({
          id: `ev-${p.id}`,
          category: "members",
          kind: "email_verified",
          title: "Email verified",
          description: p.full_name ?? p.username ?? "Member",
          entityId: p.id,
          href: adminAppPath(`/members/${p.id}`),
          at: p.email_verified_at
        });
      }
    }

    for (const b of bonusRows) {
      events.push({
        id: `wb-${b.id}`,
        category: "system",
        kind: "welcome_bonus_reserved",
        title: "Welcome bonus reserved",
        description: `Allocation #${b.allocation_number} · ₦${Number(b.amount).toLocaleString("en-NG")} · ${b.status}`,
        entityId: b.user_id,
        href: adminAppPath("/welcome-bonus"),
        at: b.created_at
      });
    }

    for (const a of audits.data ?? []) {
      const category: OperationsFeedCategory =
        a.entity_type === "withdrawal"
          ? "withdrawals"
          : a.entity_type === "deposit"
            ? "deposits"
            : a.entity_type === "profile"
              ? "members"
              : /security|login|auth/i.test(a.action)
                ? "security"
                : "system";
      events.push({
        id: `audit-${a.id}`,
        category,
        kind: "admin_action",
        title: a.action.replace(/\./g, " · "),
        description: [a.entity_type, a.entity_id].filter(Boolean).join(" · ") || undefined,
        entityId: a.entity_id,
        href: adminAppPath("/audit"),
        at: a.created_at
      });
    }

    let filtered = events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    if (input.category && input.category !== "all") {
      filtered = filtered.filter((e) => e.category === input.category);
    }

    if (input.q?.trim()) {
      const q = input.q.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.kind.includes(q)
      );
    }

    return filtered.slice(0, limit);
  }
}
