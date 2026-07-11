import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { mapInvestmentRows } from "@/lib/investment/mappers";
import { formatSettlementLabel } from "@/lib/packages/investment-catalog";
import { formatNaira } from "@/lib/domain";
import { InvestmentAccrualPanel } from "@/components/investment/InvestmentAccrualPanel";
import { InvestmentStopPanel } from "@/components/investment/InvestmentStopPanel";
import { getTierConfig } from "@/lib/packages/tier-config";
import { StatusBadge } from "@/components/design-system";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InvestmentDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getSessionUser();
  const services = await getUserServices();
  if (!user || !services) notFound();

  const { data: investment } = await services.supabase
    .from("investments")
    .select("*, investment_plans(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!investment) notFound();

  const settlements = await services.settlements.listForInvestment(id);
  const paidSettlements = settlements.filter((s) => s.status === "paid");
  const lastPaid = paidSettlements.reduce<string | null>((max, s) => {
    if (!s.settled_at) return max;
    return !max || s.settled_at > max ? s.settled_at : max;
  }, null);

  const rows = mapInvestmentRows([investment as Parameters<typeof mapInvestmentRows>[0][0]], settlements);
  const row = rows[0];
  const plan = (investment as { investment_plans?: { name?: string; tier?: string; weekly_roi_bps?: number } | null })
    .investment_plans;
  const tierConfig = getTierConfig(String(plan?.tier ?? "starter"));
  const weeklyRoiPercent =
    Number((investment as { weekly_roi_bps?: number }).weekly_roi_bps ?? plan?.weekly_roi_bps ?? tierConfig?.weeklyRoiBps ?? 1000) /
    100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/portfolio">
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowLeft size={14} /> Portfolio
          </Button>
        </Link>
        <Badge variant="outline">{plan?.name ?? "Investment"}</Badge>
        <StatusBadge status={investment.status} />
      </div>

      <header>
        <p className="font-mono text-xs text-[var(--text-subtle)]">{investment.reference ?? investment.id}</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--heading)]">Investment details</h1>
      </header>

      <InvestmentAccrualPanel row={row} />

      <InvestmentStopPanel
        investmentId={investment.id}
        status={investment.status}
        stopRequestedAt={(investment as { stop_requested_at?: string | null }).stop_requested_at ?? null}
        amount={Number(investment.amount)}
        totalEarned={Number(investment.total_earned ?? 0)}
        weeklyRoiPercent={weeklyRoiPercent}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Investment amount</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatNaira(Number(investment.amount))}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-xs text-[var(--text-subtle)]">Credited earnings</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--emerald)]">
            {formatNaira(Number(investment.total_earned ?? 0))}
          </p>
        </Card>
      </div>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Investment timeline</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Calendar size={16} className="mt-0.5 text-[var(--emerald)]" aria-hidden />
            <div>
              <dt className="text-xs text-[var(--text-subtle)]">Started on</dt>
              <dd className="font-medium">{new Date(investment.started_at).toLocaleString("en-NG")}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp size={16} className="mt-0.5 text-[var(--emerald)]" aria-hidden />
            <div>
              <dt className="text-xs text-[var(--text-subtle)]">Matures on</dt>
              <dd className="font-medium">{new Date(investment.ends_at).toLocaleString("en-NG")}</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Settlement frequency</dt>
            <dd className="font-medium">{formatSettlementLabel(row.settlementFrequency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Last settlement</dt>
            <dd className="font-medium">
              {lastPaid ? new Date(lastPaid).toLocaleString("en-NG") : "Pending first settlement"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Settlement history</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
                <th className="pb-2">Scheduled</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-[var(--text-subtle)]">
                    No settlements scheduled yet
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)]">
                    <td className="py-3">{new Date(s.scheduled_for).toLocaleDateString("en-NG")}</td>
                    <td className="py-3 tabular-nums font-medium">{formatNaira(Number(s.amount))}</td>
                    <td className="py-3">
                      <StatusBadge status={s.status === "paid" ? "completed" : s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
