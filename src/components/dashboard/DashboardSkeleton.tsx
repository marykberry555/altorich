import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[var(--radius)]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="elevated" padding="md">
          <Skeleton className="mb-4 h-6 w-40" />
          <Skeleton className="h-48 w-full" />
        </Card>
        <Card variant="elevated" padding="md">
          <Skeleton className="mb-4 h-6 w-40" />
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    </div>
  );
}
