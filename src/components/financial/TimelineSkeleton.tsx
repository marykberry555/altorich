import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/EmptyState";

export function TimelineSkeleton() {
  return (
    <Card variant="elevated" padding="md" aria-busy="true" aria-label="Loading activity">
      <Skeleton className="h-3 w-32" />
      <div className="mt-5 space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
