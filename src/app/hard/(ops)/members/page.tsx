import { MembersAdminPanel } from "@/components/admin/MembersAdminPanel";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Members</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Create, fund, pause, or remove member accounts.</p>
      </header>
      <MembersAdminPanel />
    </div>
  );
}
