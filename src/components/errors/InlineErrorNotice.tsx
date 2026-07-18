"use client";

import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { Button } from "@/components/ui/Button";
import type { ErrorNextAction } from "@/lib/errors/taxonomy";
import { cn } from "@/lib/utils";

type Props = {
  message: string;
  referenceId?: string;
  nextAction?: ErrorNextAction;
  onRetry?: () => void;
  className?: string;
};

/** Inline form/page error — never a full-screen dead end. */
export function InlineErrorNotice({ message, referenceId, nextAction, onRetry, className }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-[var(--radius-sm)] border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100",
        className
      )}
    >
      <p>{message}</p>
      {referenceId ? (
        <p className="mt-1 font-mono text-[11px] opacity-80">Reference ID: {referenceId}</p>
      ) : null}
      {(nextAction || onRetry) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onRetry || nextAction?.action === "retry" ? (
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              {nextAction?.label ?? "Retry"}
            </Button>
          ) : null}
          {nextAction?.href ? (
            <Link href={nextAction.href}>
              <Button type="button" size="sm" variant="ghost">
                {nextAction.label}
              </Button>
            </Link>
          ) : null}
          {nextAction?.action === "support" ? (
            <a href={`mailto:${COMPANY.supportEmail}`}>
              <Button type="button" size="sm" variant="ghost">
                Contact Support
              </Button>
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
