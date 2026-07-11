import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 pb-4">
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Card variant="elevated" padding="md">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-[var(--radius)]" />
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-72 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
