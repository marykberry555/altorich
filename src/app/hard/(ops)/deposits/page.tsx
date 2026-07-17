import { Check, X } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { getServiceRoleServices } from "@/lib/services";
import { DashboardSection, MetricStatCard, SectionHeading, StatusBadge } from "@/components/design-system";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const services = await getServiceRoleServices();
  const pending = services ? await services.deposits.listPending() : [];
  const stats = services ? await services.deposits.getAdminStats() : { approved: 0, pending: 0, members: 0 };
  const metrics = services ? await services.analytics.getAdminMetrics() : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Funding & deposits</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Review pending funding requests and deposit metrics.</p>
      </header>

      <DashboardSection title="Deposit metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricStatCard title="Approved deposits" value={formatNaira(stats.approved)} accent="emerald" />
          <MetricStatCard title="Pending funding" value={formatNaira(stats.pending)} accent="amber" />
          <MetricStatCard title="Deposits (month)" value={formatNaira(metrics?.depositsThisMonth ?? 0)} accent="navy" />
        </div>
        <div className="mt-4">
          <a href="/api/admin/export?type=deposits" className="button text-xs">
            Export funding CSV
          </a>
        </div>
      </DashboardSection>

      <Card variant="elevated" padding="md">
        <SectionHeading title={`Pending funding (${pending.length})`} />
        <div className="max-h-[32rem] space-y-3 overflow-y-auto">
          {pending.length === 0 ? (
            <p className="text-sm text-[var(--text-subtle)]">No pending funding requests</p>
          ) : (
            pending.map((deposit) => (
              <div key={deposit.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{deposit.member_name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatNaira(Number(deposit.amount))} · {deposit.phone}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <div className="mt-3 flex gap-2">
                  <form action={`/api/deposits/${deposit.id}`} method="post">
                    <input name="status" value="approved" type="hidden" />
                    <button type="submit" className="button text-xs">
                      <Check size={14} /> Approve
                    </button>
                  </form>
                  <form action={`/api/deposits/${deposit.id}`} method="post">
                    <input name="status" value="rejected" type="hidden" />
                    <button type="submit" className="button warn text-xs">
                      <X size={14} /> Reject
                    </button>
                  </form>
                  {deposit.proof_url ? (
                    <a href={deposit.proof_url} target="_blank" rel="noreferrer" className="button text-xs">
                      View proof
                    </a>
                  ) : null}
                </div>
                {deposit.reference ? (
                  <p className="mt-2 text-[11px] text-[var(--text-subtle)]">Ref: {deposit.reference}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
