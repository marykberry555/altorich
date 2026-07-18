import { formatNaira } from "@/lib/domain";
import { getServiceRoleServices } from "@/lib/services";
import { DataTable, SectionHeading, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const services = await getServiceRoleServices();
  let activeInvestments: { id: string; reference: string | null; amount: number; status: string; ends_at: string }[] = [];
  if (services) {
    const { data } = await services.supabase
      .from("investments")
      .select("id, reference, amount, status, ends_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100);
    activeInvestments = (data ?? []) as typeof activeInvestments;
  }

  return (
    <div className="min-w-0 space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Active investments</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Monitor live investment positions across the platform.</p>
      </header>

      <Card variant="elevated" padding="md" className="min-w-0">
        <SectionHeading title={`Active investments (${activeInvestments.length})`} />

        <ul className="space-y-3 md:hidden">
          {activeInvestments.length === 0 ? (
            <li className="py-8 text-center text-sm text-[var(--text-subtle)]">No active investments</li>
          ) : (
            activeInvestments.map((inv) => (
              <li key={inv.id} className="min-w-0 rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
                <p className="truncate font-medium text-[var(--heading)]">{inv.reference ?? inv.id.slice(0, 8)}</p>
                <p className="mt-1 tabular-nums text-sm font-semibold text-[var(--emerald)]">
                  {formatNaira(Number(inv.amount))}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                  <span>Matures {new Date(inv.ends_at).toLocaleDateString("en-NG")}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="hidden md:block">
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
        </div>
      </Card>
    </div>
  );
}
