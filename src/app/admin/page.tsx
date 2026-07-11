import { Check, X } from "lucide-react";
import type { ComponentProps } from "react";
import { formatNaira } from "@/lib/domain";
import { getServiceRoleServices } from "@/lib/services";
import { COMPANY } from "@/lib/company";
import type { Withdrawal } from "@/types/database";
import {
  DashboardSection,
  DataTable,
  MetricStatCard,
  SectionHeading,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/design-system";
import { Card } from "@/components/ui/Card";
import { RoiAdminControls } from "@/components/admin/RoiAdminControls";
import { AdminFeatureFlags } from "@/components/admin/AdminFeatureFlags";
import { AdminReferralManagement } from "@/components/admin/AdminReferralManagement";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const services = await getServiceRoleServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);
  const bank = services ? await services.settings.getBankSwitchboard() : null;
  const announcement = services ? await services.settings.getAnnouncement() : "";
  const withdrawalWindows = services ? await services.settings.getWithdrawalWindows() : "";
  const pending = services ? await services.deposits.listPending() : [];
  const stats = services ? await services.deposits.getAdminStats() : { approved: 0, pending: 0, members: 0 };
  const pendingWithdrawals = services ? await services.withdrawals.listPending() : [];
  const plans = services ? await services.investments.listAllPlans() : [];
  const metrics = services ? await services.analytics.getAdminMetrics() : null;
  const auditLogs = services ? await services.audit.list({ limit: 25 }) : [];
  const roiExchange = services ? await services.settings.get<{ ngn_per_usd?: number }>("roi_exchange_rate") : null;
  const roiPayoutDest = services
    ? await services.settings.get<{ bank_enabled?: boolean; crypto_enabled?: boolean; crypto_address?: string }>("roi_payout_destinations")
    : null;
  const featureFlags = services ? await services.settings.getFeatureFlags() : null;

  let referralAdmin = null;
  if (services) {
    try {
      referralAdmin = {
        config: await services.referrals.getProgramConfig(),
        vipLevels: await services.referrals.listVipLevels(),
        analytics: await services.referrals.getAdminAnalytics(),
        pendingPayouts: await services.referrals.listPendingPayouts()
      };
    } catch {
      referralAdmin = null;
    }
  }

  let withdrawals: Withdrawal[] = [];
  let activeInvestments: { id: string; reference: string | null; amount: number; status: string; ends_at: string }[] = [];
  if (services) {
    withdrawals = await services.withdrawals.listRecent(20);
    const { data } = await services.supabase
      .from("investments")
      .select("id, reference, amount, status, ends_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);
    activeInvestments = (data ?? []) as typeof activeInvestments;
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

      <DashboardSection title="Platform metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricStatCard title="Approved deposits" value={formatNaira(stats.approved)} accent="emerald" />
          <MetricStatCard title="Pending funding" value={formatNaira(stats.pending)} accent="amber" />
          <MetricStatCard title="Members" value={String(metrics?.members ?? stats.members)} accent="navy" />
          <MetricStatCard title="Wallet liquidity" value={formatNaira(metrics?.totalWalletBalance ?? 0)} accent="sky" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricStatCard title="Deposits (month)" value={formatNaira(metrics?.depositsThisMonth ?? 0)} accent="emerald" />
          <MetricStatCard title="Payouts (month)" value={formatNaira(metrics?.withdrawalsThisMonth ?? 0)} accent="amber" />
          <MetricStatCard title="Pending payouts" value={String(metrics?.pendingWithdrawals ?? pendingWithdrawals.length)} accent="gold" />
          <MetricStatCard title="Revenue (earnings)" value={formatNaira(metrics?.revenueEstimate ?? 0)} accent="navy" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/admin/export?type=deposits" className="button text-xs">
            Export funding CSV
          </a>
          <a href="/api/admin/export?type=withdrawals" className="button text-xs">
            Export payouts CSV
          </a>
          <a href="/api/admin/export?type=members" className="button text-xs">
            Export members CSV
          </a>
        </div>
      </DashboardSection>

      <Card variant="elevated" padding="md" id="settlements">
        <SectionHeading
          title="Settlement engine"
          description="Process due settlements and mature completed investments. Credits wallet via ledger."
        />
        <form action="/api/admin/settlements/process" method="post">
          <button type="submit" className="button">
            Run settlement cycle
          </button>
        </form>
      </Card>

      {roiEnabled ? (
        <RoiAdminControls
          exchangeRateNgnPerUsd={Number(roiExchange?.ngn_per_usd ?? 1600)}
          bankEnabled={Boolean(roiPayoutDest?.bank_enabled ?? true)}
          cryptoEnabled={Boolean(roiPayoutDest?.crypto_enabled ?? true)}
          cryptoAddress={String(roiPayoutDest?.crypto_address ?? "")}
        />
      ) : null}

      {featureFlags ? <AdminFeatureFlags initial={featureFlags} /> : null}

      {referralAdmin ? (
        <AdminReferralManagement
          initialConfig={referralAdmin.config}
          initialVipLevels={referralAdmin.vipLevels}
          analytics={referralAdmin.analytics}
          pendingPayouts={referralAdmin.pendingPayouts as unknown as ComponentProps<typeof AdminReferralManagement>["pendingPayouts"]}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="elevated" padding="md" id="settings">
          <SectionHeading title="Bank switchboard & announcements" />
          <form action="/api/system-config" method="post" className="grid gap-3">
            <label className="grid gap-1 text-sm">
              Bank name
              <input name="activeBankName" className="field" defaultValue={bank?.active_bank_name ?? ""} />
            </label>
            <label className="grid gap-1 text-sm">
              Account name
              <input name="activeAccountName" className="field" defaultValue={bank?.active_account_name ?? COMPANY.legalName} />
            </label>
            <label className="grid gap-1 text-sm">
              Account number
              <input name="activeAccountNumber" className="field" defaultValue={bank?.active_account_number ?? ""} />
            </label>
            <label className="grid gap-1 text-sm">
              Announcement
              <textarea name="globalAnnouncement" rows={2} className="field" defaultValue={announcement} />
            </label>
            <label className="grid gap-1 text-sm">
              Payout windows
              <input name="withdrawalWindows" className="field" defaultValue={withdrawalWindows} />
            </label>
            <button type="submit" className="button">
              Save configuration
            </button>
          </form>
        </Card>

        <Card variant="elevated" padding="md" id="deposits">
          <SectionHeading title={`Pending funding (${pending.length})`} />
          <div className="max-h-96 space-y-3 overflow-y-auto">
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
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {pendingWithdrawals.length > 0 ? (
        <Card variant="elevated" padding="md" id="withdrawals">
          <SectionHeading title={`Pending payouts (${pendingWithdrawals.length})`} />
          <div className="space-y-3">
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <p className="font-medium tabular-nums">{formatNaira(Number(w.amount))}</p>
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
            ))}
          </div>
        </Card>
      ) : null}

      <Card variant="elevated" padding="md" id="plans">
        <SectionHeading title={`Investment plans (${plans.length})`} />
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Min–Max</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatNaira(Number(p.min_investment ?? p.price))} – {formatNaira(Number(p.max_investment ?? p.price))}
                  </TableCell>
                  <TableCell className="capitalize">{p.settlement_frequency ?? "daily"}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.plan_status ?? "active"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      </Card>

      <Card variant="elevated" padding="md" id="investments">
        <SectionHeading title="Active investments" />
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeInvestments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-[var(--text-subtle)]">
                    No active investments
                  </TableCell>
                </TableRow>
              ) : (
                activeInvestments.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.reference ?? inv.id.slice(0, 8)}</TableCell>
                    <TableCell className="tabular-nums">{formatNaira(Number(inv.amount))}</TableCell>
                    <TableCell>{new Date(inv.ends_at).toLocaleDateString("en-NG")}</TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DataTable>
      </Card>

      <Card variant="elevated" padding="md">
        <SectionHeading title="Audit log (recent)" description="Immutable record of sensitive admin actions." />
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-[var(--text-subtle)]">
                    No audit entries yet
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="text-[var(--text-muted)]">
                      {log.entity_type}
                      {log.entity_id ? ` · ${String(log.entity_id).slice(0, 8)}` : ""}
                    </TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString("en-NG")}</TableCell>
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
