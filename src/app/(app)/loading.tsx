import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export default function AppSectionLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <DashboardSkeleton />
    </div>
  );
}
