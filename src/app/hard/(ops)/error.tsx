"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";
import { HARD_OPS_HOME } from "@/lib/hard-ops";

export default function HardOpsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      route="/hard"
      component="HardOpsErrorBoundary"
      dashboardHref={HARD_OPS_HOME}
      homeHref={HARD_OPS_HOME}
    />
  );
}
