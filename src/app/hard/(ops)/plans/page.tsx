import { formatNaira } from "@/lib/domain";
import { getServiceRoleServices } from "@/lib/services";
import { DataTable, SectionHeading, StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/design-system";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const services = await getServiceRoleServices();
  const plans = services ? await services.investments.listAllPlans() : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Investment plans</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">All configured investment packages and their status.</p>
      </header>

      <Card variant="elevated" padding="md">
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
    </div>
  );
}
