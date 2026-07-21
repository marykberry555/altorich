import { AdminAnnouncementCenter } from "@/components/admin-ops/AdminAnnouncementCenter";

export const dynamic = "force-dynamic";

export default function AdminAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Communications</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Announcement center</h1>
        <p className="mt-2 text-sm text-zinc-400">Create, preview, and schedule member announcements.</p>
      </header>
      <AdminAnnouncementCenter />
    </div>
  );
}
