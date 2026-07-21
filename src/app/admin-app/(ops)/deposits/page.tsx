import { DepositReviewWorkspace } from "@/components/admin-ops/DepositReviewWorkspace";

export const dynamic = "force-dynamic";

export default function AdminAppDepositsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Operations</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Deposit review</h1>
        <p className="mt-2 text-sm text-zinc-400">Review funding requests with risk indicators and approval actions.</p>
      </header>
      <DepositReviewWorkspace />
    </div>
  );
}
