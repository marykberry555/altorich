import { AdminErrorsClient } from "@/components/admin-app/AdminErrorsClient";

export const dynamic = "force-dynamic";

export default function AdminErrorsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Monitoring</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Error log</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Unexpected member and API failures with reference IDs. Stack traces stay internal.
        </p>
      </header>
      <AdminErrorsClient />
    </div>
  );
}
