"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function AuthError({
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
      route="/auth"
      component="AuthErrorBoundary"
      dashboardHref="/login"
      homeHref="/login"
    />
  );
}
