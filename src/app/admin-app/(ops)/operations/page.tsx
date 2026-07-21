import { OperationsFeedPanel } from "@/components/admin-ops/OperationsFeedPanel";

export const dynamic = "force-dynamic";

export default function AdminOperationsFeedPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Live operations feed</h1>
        <p className="mt-2 text-sm text-zinc-400">Real-time platform events across deposits, withdrawals, members, and admin actions.</p>
      </header>
      <OperationsFeedPanel limit={100} />
    </div>
  );
}
