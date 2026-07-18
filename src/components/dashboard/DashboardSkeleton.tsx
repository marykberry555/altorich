import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)] sm:h-64" />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-48 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
