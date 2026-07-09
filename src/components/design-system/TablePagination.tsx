import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  previousHref?: string;
  nextHref?: string;
  className?: string;
};

export function TablePagination({ page, totalPages, onPrevious, onNext, previousHref, nextHref, className }: Props) {
  if (totalPages <= 1) return null;

  const showPrev = page > 1;
  const showNext = page < totalPages;

  return (
    <div className={cn("flex items-center justify-between gap-4 pt-4", className)}>
      <p className="text-sm text-[var(--text-muted)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {showPrev ? (
          onPrevious ? (
            <Button variant="outline" size="sm" onClick={onPrevious}>
              Previous
            </Button>
          ) : previousHref ? (
            <Link href={previousHref}>
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          ) : null
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {showNext ? (
          onNext ? (
            <Button variant="outline" size="sm" onClick={onNext}>
              Next
            </Button>
          ) : nextHref ? (
            <Link href={nextHref}>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          ) : null
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
