import { COMPANY } from "@/lib/company";

export default function AdminAppReportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Reports & exports</h1>
        <p className="mt-2 text-sm text-zinc-400">Download operational CSV exports from the live platform data.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a href="/api/admin/export?type=members" className="button">
          Export members CSV
        </a>
        <a href="/api/admin/export?type=deposits" className="button">
          Export deposits CSV
        </a>
        <a href="/api/admin/export?type=withdrawals" className="button">
          Export withdrawals CSV
        </a>
      </div>
      <p className="text-xs text-zinc-500">
        Exports use the same secured admin APIs as {COMPANY.brand} web operations — no duplicated reporting logic.
      </p>
    </div>
  );
}
