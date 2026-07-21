import { COMPANY } from "@/lib/company";
import { ExecutiveOperationsDashboard } from "@/components/admin-ops/ExecutiveOperationsDashboard";

export const dynamic = "force-dynamic";

export default function AdminAppDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Executive operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Command center</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {COMPANY.brand} · {COMPANY.legalName} · live operational intelligence
        </p>
      </header>
      <ExecutiveOperationsDashboard />
    </div>
  );
}
