import { ExportCenterPanel } from "@/components/admin-ops/ExportCenterPanel";
import { ADMIN_ROLE_DEFINITIONS } from "@/lib/admin-ops/roles";

export const dynamic = "force-dynamic";

export default function AdminExportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Reporting</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Export center</h1>
        <p className="mt-2 text-sm text-zinc-400">Download operational datasets. PDF exports will appear as they become available.</p>
      </header>
      <ExportCenterPanel />
      <section className="rounded-xl border border-white/10 bg-zinc-900/80 p-5">
        <h2 className="text-sm font-semibold text-white">Role-ready architecture</h2>
        <p className="mt-2 text-sm text-zinc-400">Future admin roles can scope export access without UI changes.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ADMIN_ROLE_DEFINITIONS.map((role) => (
            <li key={role.id} className="rounded-lg border border-white/5 px-3 py-2">
              <p className="text-sm font-medium text-white">{role.label}</p>
              <p className="text-xs text-zinc-500">{role.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
