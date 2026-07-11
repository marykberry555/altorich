import { COMPANY } from "@/lib/company";
import { AdminLiveDashboard } from "@/components/admin-app/AdminLiveDashboard";

export const dynamic = "force-dynamic";

export default function AdminAppDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Live operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Admin dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {COMPANY.brand} · {COMPANY.legalName} · near real-time metrics
        </p>
      </header>
      <AdminLiveDashboard />
    </div>
  );
}
