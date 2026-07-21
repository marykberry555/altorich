import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { adminAppPath } from "@/lib/admin-app/constants";
import type { FraudAlert } from "@/lib/admin-ops/types";

type Client = SupabaseClient<Database>;

export class FraudDetectionService {
  constructor(private readonly supabase: Client) {}

  async getAlerts(limit = 30): Promise<FraudAlert[]> {
    const alerts: FraudAlert[] = [];
    const now = new Date().toISOString();

    const [phones, bankAccounts, recentLogins, recentProfiles, flaggedProfiles] = await Promise.all([
      this.supabase.from("profiles").select("id, full_name, phone").not("phone", "is", null).limit(500),
      this.supabase.from("bank_accounts").select("id, user_id, account_number, bank_name").limit(500),
      this.supabase
        .from("login_activity")
        .select("user_id, device_type, ip_address, created_at")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(200),
      this.supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false }),
      this.supabase
        .from("profiles")
        .select("id, full_name, account_status")
        .in("account_status", ["paused", "disabled", "deactivated"])
        .limit(50)
    ]);

    const phoneMap = new Map<string, { id: string; name: string }[]>();
    for (const row of phones.data ?? []) {
      const phone = row.phone?.trim();
      if (!phone) continue;
      const list = phoneMap.get(phone) ?? [];
      list.push({ id: row.id, name: row.full_name ?? "Member" });
      phoneMap.set(phone, list);
    }

    for (const [phone, members] of phoneMap) {
      if (members.length < 2) continue;
      alerts.push({
        id: `dup-phone-${phone}`,
        kind: "duplicate_phone",
        severity: "high",
        title: "Duplicate phone number",
        description: `${members.length} accounts share ${phone}`,
        memberId: members[0]?.id,
        memberName: members[0]?.name,
        detectedAt: now,
        href: adminAppPath(`/members/${members[0]?.id}`)
      });
    }

    const bankMap = new Map<string, string[]>();
    for (const row of bankAccounts.data ?? []) {
      const key = `${row.bank_name}:${row.account_number}`;
      const list = bankMap.get(key) ?? [];
      list.push(row.user_id);
      bankMap.set(key, list);
    }

    for (const [key, userIds] of bankMap) {
      const unique = [...new Set(userIds)];
      if (unique.length < 2) continue;
      alerts.push({
        id: `dup-bank-${key}`,
        kind: "duplicate_bank_account",
        severity: "high",
        title: "Repeated bank account",
        description: `${unique.length} members linked to the same account`,
        memberId: unique[0],
        detectedAt: now,
        href: adminAppPath(`/members/${unique[0]}`)
      });
    }

    const deviceByUser = new Map<string, Set<string>>();
    const ipByUser = new Map<string, Set<string>>();
    for (const row of recentLogins.data ?? []) {
      if (row.device_type) {
        const set = deviceByUser.get(row.user_id) ?? new Set();
        set.add(row.device_type);
        deviceByUser.set(row.user_id, set);
      }
      if (row.ip_address) {
        const set = ipByUser.get(row.user_id) ?? new Set();
        set.add(String(row.ip_address));
        ipByUser.set(row.user_id, set);
      }
    }

    for (const [userId, devices] of deviceByUser) {
      if (devices.size >= 4) {
        alerts.push({
          id: `multi-device-${userId}`,
          kind: "multiple_devices",
          severity: "medium",
          title: "Multiple devices",
          description: `${devices.size} device types in the last 7 days`,
          memberId: userId,
          detectedAt: now,
          href: adminAppPath(`/members/${userId}`)
        });
      }
    }

    for (const [userId, ips] of ipByUser) {
      if (ips.size >= 5) {
        alerts.push({
          id: `susp-login-${userId}`,
          kind: "suspicious_login",
          severity: "medium",
          title: "Suspicious login pattern",
          description: `${ips.size} distinct IP addresses in 7 days`,
          memberId: userId,
          detectedAt: now,
          href: adminAppPath(`/members/${userId}`)
        });
      }
    }

    const regCount = recentProfiles.data?.length ?? 0;
    if (regCount >= 10) {
      alerts.push({
        id: "rapid-registration",
        kind: "rapid_registration",
        severity: "medium",
        title: "Rapid registration volume",
        description: `${regCount} new registrations in the last 24 hours`,
        detectedAt: now,
        href: adminAppPath("/members")
      });
    }

    for (const p of flaggedProfiles.data ?? []) {
      alerts.push({
        id: `flagged-${p.id}`,
        kind: "flagged_account",
        severity: "low",
        title: "Flagged account",
        description: `${p.full_name ?? "Member"} · status ${p.account_status}`,
        memberId: p.id,
        memberName: p.full_name,
        detectedAt: now,
        href: adminAppPath(`/members/${p.id}`)
      });
    }

    return alerts
      .sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, limit);
  }
}
