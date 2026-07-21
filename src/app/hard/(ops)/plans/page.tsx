import { getServiceRoleServices } from "@/lib/services";
import { PlansAdminPanel } from "@/components/admin/PlansAdminPanel";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const services = await getServiceRoleServices();
  const plans = services ? await services.investments.listAllPlans() : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Investment portfolios</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Manage portfolio slots linked to the centralized configuration.</p>
      </header>

      <Card variant="elevated" padding="md">
        <PlansAdminPanel initialPlans={plans} />
      </Card>
    </div>
  );
}
