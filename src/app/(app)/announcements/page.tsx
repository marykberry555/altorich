import { Suspense } from "react";
import { AnnouncementCentre } from "@/components/member-experience/AnnouncementCentre";
import { DashboardSection } from "@/components/design-system";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { PLATFORM_ANNOUNCEMENTS } from "@/lib/member-experience/announcements";

function AnnouncementsContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--heading)]">Announcement Centre</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Platform updates, maintenance schedules, policy changes, and educational notices.
        </p>
      </header>

      <DashboardSection>
        <AnnouncementCentre announcements={PLATFORM_ANNOUNCEMENTS} />
      </DashboardSection>
    </div>
  );
}

export default function AnnouncementsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AnnouncementsContent />
    </Suspense>
  );
}
