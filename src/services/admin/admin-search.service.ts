import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { adminAppPath } from "@/lib/admin-app/constants";

type Client = SupabaseClient<Database>;

export type AdminSearchResult = {
  id: string;
  type: "member" | "deposit" | "withdrawal" | "investment" | "referral" | "wallet";
  title: string;
  subtitle: string;
  href: string;
};

export class AdminSearchService {
  constructor(private readonly supabase: Client) {}

  async search(query: string, limit = 20): Promise<AdminSearchResult[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const escaped = q.replace(/[%_]/g, "");
    const pattern = `%${escaped}%`;

    const [members, deposits, withdrawals, investments, referrals] = await Promise.all([
      this.supabase
        .from("profiles")
        .select("id, full_name, username, phone, invite_code")
        .or(`full_name.ilike.${pattern},username.ilike.${pattern},phone.ilike.${pattern},invite_code.ilike.${pattern}`)
        .limit(limit),
      this.supabase.from("deposits").select("id, user_id, amount, reference, status").ilike("reference", pattern).limit(limit),
      this.supabase.from("withdrawals").select("id, user_id, amount, account_number, status").ilike("account_number", pattern).limit(limit),
      this.supabase.from("investments").select("id, user_id, amount, status").limit(limit),
      this.supabase.from("referrals").select("id, referrer_id, referred_id, status").limit(limit)
    ]);

    const results: AdminSearchResult[] = [];

    for (const row of members.data ?? []) {
      results.push({
        id: row.id,
        type: "member",
        title: row.full_name || row.username || "Member",
        subtitle: [row.username, row.phone, row.invite_code].filter(Boolean).join(" · "),
        href: adminAppPath(`/members/${row.id}`)
      });
    }

    for (const row of deposits.data ?? []) {
      results.push({
        id: row.id,
        type: "deposit",
        title: `Deposit · ₦${Number(row.amount).toLocaleString("en-NG")}`,
        subtitle: row.reference ?? row.status,
        href: adminAppPath("/deposits")
      });
    }

    for (const row of withdrawals.data ?? []) {
      results.push({
        id: row.id,
        type: "withdrawal",
        title: `Withdrawal · ₦${Number(row.amount).toLocaleString("en-NG")}`,
        subtitle: row.account_number ?? row.status,
        href: adminAppPath("/payouts")
      });
    }

    for (const row of investments.data ?? []) {
      if (String(row.id).includes(escaped) || String(row.amount).includes(escaped)) {
        results.push({
        id: row.id,
        type: "investment",
        title: `Investment · ₦${Number(row.amount).toLocaleString("en-NG")}`,
        subtitle: row.status,
          href: adminAppPath("/investments")
        });
      }
    }

    if (q.length >= 8) {
      for (const row of referrals.data ?? []) {
        if (String(row.id).includes(escaped) || String(row.referrer_id).includes(escaped) || String(row.referred_id).includes(escaped)) {
          results.push({
            id: String(row.id),
            type: "referral",
            title: "Referral link",
            subtitle: String(row.status),
            href: adminAppPath("/referrals")
          });
        }
      }
    }

    return results.slice(0, limit);
  }
}
