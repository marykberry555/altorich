import { getServiceRoleServices } from "@/lib/services";
import { COMPANY } from "@/lib/company";
import { formatNaira } from "@/lib/domain";
import { DashboardSection, MetricStatCard } from "@/components/design-system";
import { AdminOperationsPanel } from "@/components/admin/AdminOperationsPanel";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const services = await getServiceRoleServices();
  const stats = services ? await services.deposits.getAdminStats() : { approved: 0, pending: 0, members: 0 };
  const metrics = services ? await services.analytics.getAdminMetrics() : null;
  const auditLogs = services ? await services.audit.list({ limit: 25 }) : [];

  let pendingReferralPayouts = 0;
  if (services) {
    try {
      const payouts = await services.referrals.listPendingPayouts();
      pendingReferralPayouts = payouts.length;
    } catch {
      pendingReferralPayouts = 0;
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations centre</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">AltoRich admin</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {COMPANY.legalName} · Co. {COMPANY.companyNumber}
        </p>
      </header>

      <AdminOperationsPanel
        metrics={metrics}
        pendingReferralPayouts={pendingReferralPayouts}
        recentAuditCount={auditLogs.length}
      />

      <DashboardSection title="Platform metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricStatCard title="Approved deposits" value={formatNaira(stats.approved)} accent="emerald" href={`${HARD_OPS_HOME}/deposits`} />
          <MetricStatCard title="Pending funding" value={formatNaira(stats.pending)} accent="amber" href={`${HARD_OPS_HOME}/deposits`} />
          <MetricStatCard title="Members" value={String(metrics?.members ?? stats.members)} accent="navy" href={`${HARD_OPS_HOME}/members`} />
          <MetricStatCard title="Wallet liquidity" value={formatNaira(metrics?.totalWalletBalance ?? 0)} accent="sky" href={`${HARD_OPS_HOME}/members`} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricStatCard title="Deposits (month)" value={formatNaira(metrics?.depositsThisMonth ?? 0)} accent="emerald" href={`${HARD_OPS_HOME}/deposits`} />
          <MetricStatCard title="Withdrawals (month)" value={formatNaira(metrics?.withdrawalsThisMonth ?? 0)} accent="amber" href={`${HARD_OPS_HOME}/payouts`} />
          <MetricStatCard
            title="Pending withdrawals"
            value={String((metrics?.pendingWithdrawals ?? 0) + pendingReferralPayouts)}
            accent="gold"
            href={`${HARD_OPS_HOME}/payouts`}
          />
          <MetricStatCard title="Revenue (earnings)" value={formatNaira(metrics?.revenueEstimate ?? 0)} accent="navy" href={`${HARD_OPS_HOME}/settlements`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/admin/export?type=deposits" className="button text-xs">
            Export funding CSV
          </a>
          <a href="/api/admin/export?type=withdrawals" className="button text-xs">
            Export withdrawals CSV
          </a>
          <a href="/api/admin/export?type=members" className="button text-xs">
            Export members CSV
          </a>
        </div>
      </DashboardSection>
    </div>
  );
}
