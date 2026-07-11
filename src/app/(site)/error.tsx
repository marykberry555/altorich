"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function SiteError({
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
      route="/site"
      component="SiteErrorBoundary"
      dashboardHref="/dashboard"
      homeHref="/"
    />
  );
}
