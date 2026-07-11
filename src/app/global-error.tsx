"use client";

import { RouteErrorFallback } from "@/components/errors/RouteErrorFallback";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <RouteErrorFallback
          error={error}
          reset={reset}
          route="global"
          component="GlobalErrorBoundary"
          dashboardHref="/dashboard"
          homeHref="/"
        />
      </body>
    </html>
  );
}
