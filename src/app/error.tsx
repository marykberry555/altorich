"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function RootSegmentError({
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
      route="/"
      component="RootErrorBoundary"
      dashboardHref="/dashboard"
      homeHref="/"
    />
  );
}
