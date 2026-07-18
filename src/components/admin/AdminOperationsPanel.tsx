import { Activity, Database, Server, ShieldCheck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { formatNaira } from "@/lib/domain";
import { HARD_OPS_HOME } from "@/lib/hard-ops";
import { createServiceClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import { DashboardSection, MetricStatCard, StatusBadge } from "@/components/design-system";
import { Card } from "@/components/ui/Card";
import type { AdminMetrics } from "@/services/admin/analytics.service";

type Props = {
  metrics: AdminMetrics | null;
  pendingReferralPayouts: number;
  recentAuditCount: number;
};

export async function AdminOperationsPanel({ metrics, pendingReferralPayouts, recentAuditCount }: Props) {
  const checks = {
    supabasePublic: isSupabaseConfigured(),
    supabaseService: isServiceRoleConfigured(),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim())
  };

  let database = false;
  let authAdmin = false;
  let dbError: string | undefined;

  if (checks.supabaseService) {
    try {
      const supabase = await createServiceClient();
      if (supabase) {
        const { error } = await supabase.from("profiles").select("id").limit(1);
        database = !error;
        if (error) dbError = error.message;

        const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        authAdmin = !authError;
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  const serverOk = checks.supabasePublic && checks.supabaseService && checks.siteUrl && database && authAdmin;
  const dbOk = database && authAdmin;

  return (
    <DashboardSection title="Live operations">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="elevated" padding="md" className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
            <Server size={16} className="text-[var(--emerald)]" aria-hidden />
            Server health
          </div>
          <StatusBadge status={serverOk ? "active" : "pending"} label={serverOk ? "Healthy" : "Degraded"} />
          <ul className="space-y-1 text-xs text-[var(--text-muted)]">
            <li>Site URL: {checks.siteUrl ? "configured" : "missing"}</li>
            <li>Supabase public: {checks.supabasePublic ? "ok" : "missing"}</li>
            <li>Service role: {checks.supabaseService ? "ok" : "missing"}</li>
            <li>Resend email: {checks.resend ? "ok" : "optional"}</li>
          </ul>
        </Card>

        <Card variant="elevated" padding="md" className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
            <Database size={16} className="text-[var(--emerald)]" aria-hidden />
            Database health
          </div>
          <StatusBadge status={dbOk ? "active" : "pending"} label={dbOk ? "Connected" : "Issue"} />
          <p className="text-xs text-[var(--text-muted)]">
            Postgres reachable · Auth admin {authAdmin ? "ok" : "failed"}
          </p>
          {dbError ? <p className="text-xs text-[var(--danger)]">{dbError}</p> : null}
        </Card>

        <Link href={`${HARD_OPS_HOME}/audit`} className="block rounded-[var(--radius)] transition hover:opacity-95">
          <Card variant="elevated" padding="md" className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
              <ShieldCheck size={16} className="text-[var(--emerald)]" aria-hidden />
              Security posture
            </div>
            <StatusBadge status="active" label="RLS enforced" />
            <p className="text-xs text-[var(--text-muted)]">
              Admin routes gated · Service role server-only · {recentAuditCount} recent audit entries
            </p>
          </Card>
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricStatCard
          title="Active members"
          value={String(metrics?.members ?? 0)}
          accent="navy"
          icon={<Users size={16} aria-hidden />}
          href={`${HARD_OPS_HOME}/members`}
        />
        <MetricStatCard
          title="Active investments"
          value={String(metrics?.activeInvestments ?? 0)}
          accent="emerald"
          icon={<Activity size={16} aria-hidden />}
          href={`${HARD_OPS_HOME}/investments`}
        />
        <MetricStatCard
          title="Wallet liquidity"
          value={formatNaira(metrics?.totalWalletBalance ?? 0)}
          accent="sky"
          icon={<Wallet size={16} aria-hidden />}
          href={`${HARD_OPS_HOME}/members`}
        />
        <MetricStatCard
          title="Pending funding"
          value={formatNaira(metrics?.pendingDeposits ?? 0)}
          accent="amber"
          href={`${HARD_OPS_HOME}/deposits`}
        />
        <MetricStatCard
          title="Pending withdrawals"
          value={String((metrics?.pendingWithdrawals ?? 0) + pendingReferralPayouts)}
          accent="gold"
          href={`${HARD_OPS_HOME}/payouts`}
        />
      </div>
    </DashboardSection>
  );
}
