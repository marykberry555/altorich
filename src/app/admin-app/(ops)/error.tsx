"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function AdminAppError({
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
      route="/admin-app"
      component="AdminAppErrorBoundary"
      dashboardHref="/admin-app"
      homeHref="/admin/auth"
      tone="dark"
    />
  );
}
