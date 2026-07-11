import { MembersAdminPanel } from "@/components/admin/MembersAdminPanel";
import { adminAppPath } from "@/lib/admin-app/constants";

export const dynamic = "force-dynamic";

export default async function AdminAppMembersPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Operations</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Members</h1>
        <p className="mt-2 text-sm text-zinc-400">Create, fund, review, and manage member accounts.</p>
      </header>
      <MembersAdminPanel profilePath={(id) => adminAppPath(`/members/${id}`)} dark />
    </div>
  );
}
