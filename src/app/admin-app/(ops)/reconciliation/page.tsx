import { ReconciliationDashboard } from "@/components/admin-ops/ReconciliationDashboard";

export const dynamic = "force-dynamic";

export default function AdminReconciliationPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Finance</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Reconciliation</h1>
        <p className="mt-2 text-sm text-zinc-400">Match platform records against bank statements and surface discrepancies.</p>
      </header>
      <ReconciliationDashboard />
    </div>
  );
}
