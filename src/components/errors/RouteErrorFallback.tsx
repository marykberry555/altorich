"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { logRouteError, errorMessage } from "@/lib/observability/route-error";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  route: string;
  component?: string;
  dashboardHref?: string;
  homeHref?: string;
};

export function RouteErrorFallback({
  error,
  reset,
  route,
  component = "RouteErrorBoundary",
  dashboardHref = "/dashboard",
  homeHref = "/"
}: Props) {
  const [reported, setReported] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);

  useEffect(() => {
    logRouteError(error, { route, component, digest: error.digest });

    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route,
        component,
        message: error.message,
        digest: error.digest,
        stack: error.stack
      })
    })
      .then((res) => {
        if (res.ok) setReported(true);
        else setReportFailed(true);
      })
      .catch(() => setReportFailed(true));
  }, [error, route, component]);

  const reportIssue = () => {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route,
        component,
        message: error.message,
        digest: error.digest,
        stack: error.stack
      })
    })
      .then((res) => {
        if (res.ok) {
          setReported(true);
          setReportFailed(false);
        }
      })
      .catch(() => setReportFailed(true));
  };

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-xl font-bold text-[var(--heading)]">Something went wrong</h1>
      <p className="text-sm text-[var(--text-muted)]">{errorMessage(error)}</p>
      {error.digest ? (
        <p className="text-xs text-[var(--text-subtle)]">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Retry
        </Button>
        <Link href={dashboardHref}>
          <Button type="button" variant="outline">
            Go to Dashboard
          </Button>
        </Link>
        <Link href={homeHref}>
          <Button type="button" variant="outline">
            Go Home
          </Button>
        </Link>
        <Button type="button" variant="ghost" disabled={reported} onClick={reportIssue}>
          {reported ? "Issue reported" : reportFailed ? "Report issue" : "Reporting…"}
        </Button>
      </div>
    </div>
  );
}
