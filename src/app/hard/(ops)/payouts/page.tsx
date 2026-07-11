import { Check, X } from "lucide-react";
import { formatNaira } from "@/lib/domain";
import { payoutStatusLabel, payoutStatusVariant } from "@/lib/payout/status";
import { getServiceRoleServices } from "@/lib/services";
import type { Withdrawal } from "@/types/database";
import { DashboardSection, MetricStatCard, SectionHeading, StatusBadge } from "@/components/design-system";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";

export const dynamic = "force-dynamic";

function requestTypeLabel(type: string | null | undefined) {
  return type === "automatic" ? "Automatic" : "Manual";
}

export default async function PayoutsPage() {
  const services = await getServiceRoleServices();
  const pendingWithdrawals = services ? await services.withdrawals.listPending() : [];
  const metrics = services ? await services.analytics.getAdminMetrics() : null;
  let withdrawals: Withdrawal[] = [];
  if (services) {
    withdrawals = await services.withdrawals.listRecent(50);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Payouts</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Review manual and automatic payout requests.</p>
      </header>

      <DashboardSection title="Payout metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricStatCard title="Pending payouts" value={String(metrics?.pendingWithdrawals ?? pendingWithdrawals.length)} accent="gold" />
          <MetricStatCard title="Payouts (month)" value={formatNaira(metrics?.withdrawalsThisMonth ?? 0)} accent="amber" />
          <MetricStatCard title="Revenue (earnings)" value={formatNaira(metrics?.revenueEstimate ?? 0)} accent="navy" />
        </div>
        <div className="mt-4">
          <a href="/api/admin/export?type=withdrawals" className="button text-xs">
            Export payouts CSV
          </a>
        </div>
      </DashboardSection>

      <Card variant="elevated" padding="md">
        <SectionHeading title={`Open payouts (${pendingWithdrawals.length})`} />
        <div className="space-y-3">
          {pendingWithdrawals.length === 0 ? (
            <p className="text-sm text-[var(--text-subtle)]">No open payout requests</p>
          ) : (
            pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium tabular-nums">{formatNaira(Number(w.amount))}</p>
                    <Badge variant={w.request_type === "automatic" ? "navy" : "outline"}>
                      {requestTypeLabel(w.request_type)}
                    </Badge>
                    <Badge variant={payoutStatusVariant(payoutStatusLabel(w))}>{payoutStatusLabel(w)}</Badge>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">
                    {w.bank_name} · {w.account_number}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={`/api/admin/withdrawals/${w.id}`} method="post">
                    <input name="status" value="approved" type="hidden" />
                    <button type="submit" className="button text-xs">
                      <Check size={14} /> Approve
                    </button>
                  </form>
                  <form action={`/api/admin/withdrawals/${w.id}`} method="post">
                    <input name="status" value="rejected" type="hidden" />
                    <button type="submit" className="button warn text-xs">
                      <X size={14} /> Reject
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card variant="elevated" padding="md">
        <SectionHeading title="Recent payouts" />
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Request type</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-[var(--text-subtle)]">
                    No recent payouts
                  </TableCell>
                </TableRow>
              ) : (
                withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="tabular-nums">{formatNaira(Number(w.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={w.request_type === "automatic" ? "navy" : "outline"}>
                        {requestTypeLabel(w.request_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{w.bank_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} />
                    </TableCell>
                    <TableCell>{new Date(w.created_at).toLocaleString("en-NG")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DataTable>
      </Card>
    </div>
  );
}
