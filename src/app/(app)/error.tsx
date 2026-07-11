"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function AppError({
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
      route="/app"
      component="AppErrorBoundary"
      dashboardHref="/dashboard"
      homeHref="/"
    />
  );
}
