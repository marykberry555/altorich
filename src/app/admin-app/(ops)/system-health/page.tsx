import { SystemHealthDashboard } from "@/components/trust/SystemHealthDashboard";

export const dynamic = "force-dynamic";

export default function AdminSystemHealthPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Internal</p>
        <h1 className="mt-2 text-2xl font-bold text-white">System health</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Monitoring architecture for application, database, email, notifications, storage, queue, jobs, and settlement.
        </p>
      </header>
      <SystemHealthDashboard />
    </div>
  );
}
