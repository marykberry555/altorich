import { FinancialHealthPanel } from "@/components/admin/FinancialHealthPanel";

export const dynamic = "force-dynamic";

export default function AdminFinancialHealthPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Financial health</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Stuck deposit workflows, processing payouts, reconcile failures, and duplicate attempts.
        </p>
      </header>
      <FinancialHealthPanel />
    </div>
  );
}
