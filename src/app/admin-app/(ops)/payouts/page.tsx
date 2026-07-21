import { WithdrawalOperationsWorkspace } from "@/components/admin-ops/WithdrawalOperationsWorkspace";

export const dynamic = "force-dynamic";

export default function AdminAppPayoutsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Operations</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Withdrawal operations</h1>
        <p className="mt-2 text-sm text-zinc-400">Manage the settlement queue, approve requests, and export records.</p>
      </header>
      <WithdrawalOperationsWorkspace />
    </div>
  );
}
