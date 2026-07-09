import { PageHero } from "@/components/marketing/PageHero";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/domain";
import { getServices } from "@/lib/services";
import type { Withdrawal } from "@/types/database";

export default async function WithdrawalsPage() {
  const services = await getServices();
  const windows = services ? await services.settings.getWithdrawalWindows() : "Mondays and Thursdays, 8:00 AM WAT";

  let withdrawals: Withdrawal[] = [];
  if (services) {
    const { data } = await services.supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(20);
    withdrawals = (data ?? []) as Withdrawal[];
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHero eyebrow="Withdrawals" title="Request a payout" description={windows} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card variant="elevated">
          <WithdrawalForm />
        </Card>
        <Card variant="elevated">
          <h2 className="font-semibold text-[var(--heading)]">Recent requests</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-subtle)]">
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Bank</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-[var(--text-subtle)]">
                      No withdrawal requests
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-[var(--border)]">
                      <td className="py-3 tabular-nums">{formatNaira(Number(w.amount))}</td>
                      <td className="py-3 text-[var(--text-muted)]">
                        {w.bank_name} · {w.account_number}
                      </td>
                      <td className="py-3">
                        <Badge variant={w.status === "paid" ? "emerald" : "gold"}>{w.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
