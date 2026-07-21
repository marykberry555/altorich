import { SupportOperationsPanel } from "@/components/admin-ops/SupportOperationsPanel";

export const dynamic = "force-dynamic";

export default function AdminAppSupportPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Support operations</h1>
        <p className="mt-2 text-sm text-zinc-400">Support overview and operational drivers while ticketing is integrated.</p>
      </header>
      <SupportOperationsPanel />
    </div>
  );
}
