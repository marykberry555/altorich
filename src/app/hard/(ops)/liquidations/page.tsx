import { formatNaira } from "@/lib/domain";
import { getServiceRoleServices } from "@/lib/services";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/design-system";
import { AdminLiquidationsPanel } from "@/components/admin/AdminLiquidationsPanel";

export const dynamic = "force-dynamic";

export default async function CapitalLiquidationsAdminPage() {
  const services = await getServiceRoleServices();
  const pending = services ? await services.liquidations.listPending().catch(() => []) : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Capital liquidation</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Approve or reject principal return requests. Active investments keep earning until approval.
        </p>
      </header>

      <Card variant="elevated" padding="md">
        <SectionHeading title={`Pending requests (${pending.length})`} description={`Total principal at risk: ${formatNaira(pending.reduce((s, r) => s + Number(r.principal_amount), 0))}`} />
        <div className="mt-4">
          <AdminLiquidationsPanel pending={pending} />
        </div>
      </Card>
    </div>
  );
}
