import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { PLATFORM_EARNING } from "@/lib/earning/platform-earning";
import { LiveMetricsService } from "@/services/admin/live-metrics.service";
import {
  mergeSystemStatus,
  type ServiceStatus,
  type SystemServiceId,
  type SystemStatusOverrides
} from "@/lib/transparency/system-status";

type Client = SupabaseClient<Database>;

const SETTINGS_KEY = "transparency_status_overrides";

export type TransparencyMetric = {
  id: string;
  label: string;
  value: string | null;
  available: boolean;
  hint?: string;
};

export type TransparencyOverview = {
  live: boolean;
  lastUpdated: string;
  settlementStatus: string;
  todayDeposits: number | null;
  todayDepositsAmount: number | null;
  todayWithdrawals: number | null;
  todayWithdrawalsAmount: number | null;
  depositsApprovedToday: number | null;
  withdrawalsProcessedToday: number | null;
  pendingDeposits: number | null;
  pendingWithdrawals: number | null;
  averageDepositApprovalMinutes: number | null;
  averageWithdrawalProcessingMinutes: number | null;
  averageSupportResponseMinutes: number | null;
  platformAvailabilityPercent: number | null;
};

export type TransparencyPlatformMetrics = {
  lastUpdated: string;
  metrics: TransparencyMetric[];
};

export type TransparencyStatusPayload = {
  overall: ServiceStatus;
  lastUpdated: string;
  services: ReturnType<typeof mergeSystemStatus>;
};

function lagosTodayStartIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "01";
  return `${get("year")}-${get("month")}-${get("day")}T00:00:00+01:00`;
}

function averageReviewMinutes(
  rows: { created_at: string; reviewed_at: string | null }[]
): number | null {
  const samples = rows
    .filter((r) => r.reviewed_at)
    .map((r) => (new Date(r.reviewed_at!).getTime() - new Date(r.created_at).getTime()) / 60_000)
    .filter((m) => Number.isFinite(m) && m >= 0);
  if (samples.length === 0) return null;
  return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export class TransparencyService {
  private readonly live: LiveMetricsService;

  constructor(private readonly supabase: Client) {
    this.live = new LiveMetricsService(supabase);
  }

  private async getStatusOverrides(): Promise<SystemStatusOverrides | null> {
    const { data } = await this.supabase.from("settings").select("value").eq("key", SETTINGS_KEY).maybeSingle();
    return (data?.value as SystemStatusOverrides | null) ?? null;
  }

  private settlementLabel(now = new Date()) {
    return `Scheduled · ${PLATFORM_EARNING.payoutTiming}`;
  }

  async getOverview(): Promise<TransparencyOverview> {
    const now = new Date();
    const lastUpdated = now.toISOString();

    try {
      const metrics = await this.live.getLiveMetrics();
      const todayStart = lagosTodayStartIso(now);
      const since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const [approvedDepositsToday, processedWithdrawalsToday, depositSamples, withdrawalSamples, verifiedCount] =
        await Promise.all([
          this.supabase
            .from("deposits")
            .select("id", { count: "exact", head: true })
            .gte("reviewed_at", todayStart)
            .in("status", ["approved", "completed"]),
          this.supabase
            .from("withdrawals")
            .select("id", { count: "exact", head: true })
            .gte("reviewed_at", todayStart)
            .in("status", ["approved", "paid", "processing"]),
          this.supabase
            .from("deposits")
            .select("created_at, reviewed_at")
            .gte("created_at", since)
            .in("status", ["approved", "completed"])
            .not("reviewed_at", "is", null)
            .limit(200),
          this.supabase
            .from("withdrawals")
            .select("created_at, reviewed_at")
            .gte("created_at", since)
            .in("status", ["approved", "paid", "processing"])
            .not("reviewed_at", "is", null)
            .limit(200),
          this.supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .not("email_verified_at", "is", null)
        ]);

      const avgDeposit = averageReviewMinutes(depositSamples.data ?? []);
      const avgWithdrawal = averageReviewMinutes(withdrawalSamples.data ?? []);

      const hasActivity =
        metrics.todayDeposits > 0 ||
        metrics.todayWithdrawals > 0 ||
        metrics.pendingDeposits > 0 ||
        metrics.pendingWithdrawals > 0;

      return {
        live: hasActivity,
        lastUpdated,
        settlementStatus: this.settlementLabel(now),
        todayDeposits: metrics.todayDeposits,
        todayDepositsAmount: metrics.todayDepositsAmount,
        todayWithdrawals: metrics.todayWithdrawals,
        todayWithdrawalsAmount: metrics.todayWithdrawalsAmount,
        depositsApprovedToday: approvedDepositsToday.count ?? 0,
        withdrawalsProcessedToday: processedWithdrawalsToday.count ?? 0,
        pendingDeposits: metrics.pendingDeposits,
        pendingWithdrawals: metrics.pendingWithdrawals,
        averageDepositApprovalMinutes: avgDeposit,
        averageWithdrawalProcessingMinutes: avgWithdrawal,
        averageSupportResponseMinutes: null,
        platformAvailabilityPercent: null
      };
    } catch {
      return {
        live: false,
        lastUpdated,
        settlementStatus: this.settlementLabel(now),
        todayDeposits: null,
        todayDepositsAmount: null,
        todayWithdrawals: null,
        todayWithdrawalsAmount: null,
        depositsApprovedToday: null,
        withdrawalsProcessedToday: null,
        pendingDeposits: null,
        pendingWithdrawals: null,
        averageDepositApprovalMinutes: null,
        averageWithdrawalProcessingMinutes: null,
        averageSupportResponseMinutes: null,
        platformAvailabilityPercent: null
      };
    }
  }

  async getPlatformMetrics(): Promise<TransparencyPlatformMetrics> {
    const overview = await this.getOverview();
    const now = new Date();
    const since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    let verifiedAccounts: number | null = null;
    let completedDeposits: number | null = null;
    let completedWithdrawals: number | null = null;

    try {
      const [verified, deposits, withdrawals] = await Promise.all([
        this.supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .not("email_verified_at", "is", null),
        this.supabase
          .from("deposits")
          .select("id", { count: "exact", head: true })
          .in("status", ["approved", "completed"]),
        this.supabase
          .from("withdrawals")
          .select("id", { count: "exact", head: true })
          .in("status", ["approved", "paid"])
      ]);
      verifiedAccounts = verified.count ?? 0;
      completedDeposits = deposits.count ?? 0;
      completedWithdrawals = withdrawals.count ?? 0;
    } catch {
      // leave null
    }

    const metrics: TransparencyMetric[] = [
      {
        id: "avg_deposit_approval",
        label: "Average deposit approval time",
        value: formatDuration(overview.averageDepositApprovalMinutes),
        available: overview.averageDepositApprovalMinutes != null,
        hint: "Based on reviewed deposits in the last 90 days."
      },
      {
        id: "avg_withdrawal_processing",
        label: "Average withdrawal processing time",
        value: formatDuration(overview.averageWithdrawalProcessingMinutes),
        available: overview.averageWithdrawalProcessingMinutes != null,
        hint: "Based on reviewed withdrawals in the last 90 days."
      },
      {
        id: "avg_support_response",
        label: "Average support response time",
        value: null,
        available: false,
        hint: "Not yet published — response-time tracking is being prepared."
      },
      {
        id: "verified_accounts",
        label: "Verified member accounts",
        value: verifiedAccounts != null ? verifiedAccounts.toLocaleString("en-NG") : null,
        available: verifiedAccounts != null
      },
      {
        id: "completed_deposits",
        label: "Completed deposits",
        value: completedDeposits != null ? completedDeposits.toLocaleString("en-NG") : null,
        available: completedDeposits != null
      },
      {
        id: "completed_withdrawals",
        label: "Completed withdrawals",
        value: completedWithdrawals != null ? completedWithdrawals.toLocaleString("en-NG") : null,
        available: completedWithdrawals != null
      },
      {
        id: "weekly_settlement",
        label: "Weekly settlement schedule",
        value: PLATFORM_EARNING.payoutTiming,
        available: true
      },
      {
        id: "system_availability",
        label: "System availability",
        value: overview.platformAvailabilityPercent != null ? `${overview.platformAvailabilityPercent}%` : null,
        available: overview.platformAvailabilityPercent != null,
        hint: "Uptime monitoring will be published when available."
      }
    ];

    return { lastUpdated: overview.lastUpdated, metrics };
  }

  async getSystemStatus(health: { apiOk: boolean; databaseOk: boolean; authOk: boolean }): Promise<TransparencyStatusPayload> {
    const overrides = await this.getStatusOverrides();
    const base: Record<SystemServiceId, ServiceStatus> = {
      website: health.apiOk ? "operational" : "degraded",
      api: health.apiOk && health.databaseOk ? "operational" : "degraded",
      deposits: health.databaseOk ? "operational" : "offline",
      withdrawals: health.databaseOk ? "operational" : "offline",
      member_portal: health.apiOk && health.databaseOk ? "operational" : "degraded",
      authentication: health.authOk ? "operational" : "degraded",
      email: health.apiOk ? "operational" : "degraded",
      notifications: health.databaseOk ? "operational" : "degraded",
      weekly_settlement: health.databaseOk ? "operational" : "degraded"
    };

    const services = mergeSystemStatus(base, overrides);
    const overall: ServiceStatus = services.some((s) => s.status === "offline")
      ? "offline"
      : services.some((s) => s.status === "degraded")
        ? "degraded"
        : services.some((s) => s.status === "maintenance")
          ? "maintenance"
          : "operational";

    return { overall, lastUpdated: new Date().toISOString(), services };
  }

  async saveStatusOverrides(overrides: SystemStatusOverrides, updatedBy?: string) {
    await this.supabase.from("settings").upsert({
      key: SETTINGS_KEY,
      value: overrides as unknown as Json,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy ?? null
    });
  }
}
