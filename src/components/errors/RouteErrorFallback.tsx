"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { logRouteError, errorMessage } from "@/lib/observability/route-error";
import { isChunkLoadFailure, recoverFromChunkFailure } from "@/lib/cache/chunk-recovery";
import { cn } from "@/lib/utils";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  route: string;
  component?: string;
  dashboardHref?: string;
  homeHref?: string;
  showDebugDetails?: boolean;
  /** Use on dark admin surfaces so copy stays readable without relying on theme CSS vars. */
  tone?: "default" | "dark";
};

export function RouteErrorFallback({
  error,
  reset,
  route,
  component = "RouteErrorBoundary",
  dashboardHref = "/dashboard",
  homeHref = "/",
  showDebugDetails = process.env.NODE_ENV !== "production",
  tone = "default"
}: Props) {
  const [reported, setReported] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);
  const dark = tone === "dark" || route.startsWith("/admin") || route.startsWith("/hard");

  useEffect(() => {
    logRouteError(error, { route, component, digest: error.digest });

    if (isChunkLoadFailure(error.message)) {
      void recoverFromChunkFailure(error.message);
      return;
    }

    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: route.startsWith("/admin") || route.startsWith("/hard") ? "admin-route" : "route-error",
        route,
        component,
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        at: new Date().toISOString(),
        device: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          standalone:
            window.matchMedia("(display-mode: standalone)").matches ||
            Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          online: navigator.onLine
        }
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
        kind: route.startsWith("/admin") || route.startsWith("/hard") ? "admin-route" : "route-error",
        route,
        component,
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        at: new Date().toISOString()
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
    <div
      className={cn(
        "mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center",
        dark && "rounded-2xl border border-white/10 bg-zinc-950"
      )}
    >
      <h1 className={cn("text-xl font-bold", dark ? "text-white" : "text-[var(--heading)]")}>
        Something went wrong
      </h1>
      <p className={cn("max-w-md text-sm", dark ? "text-zinc-300" : "text-[var(--text-muted)]")}>
        {errorMessage(error)} If the issue continues, contact our support team.
      </p>
      {error.digest ? (
        <p className={cn("text-xs", dark ? "text-zinc-500" : "text-[var(--text-subtle)]")}>
          Reference: {error.digest}
        </p>
      ) : null}
      {showDebugDetails && error.stack ? (
        <pre
          className={cn(
            "max-h-64 w-full overflow-auto rounded-lg border p-3 text-left text-[11px] leading-relaxed",
            dark
              ? "border-white/10 bg-zinc-900 text-zinc-300"
              : "border-[var(--border)] bg-[var(--gray-50)] text-[var(--text-muted)]"
          )}
        >
          {error.stack}
        </pre>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Retry
        </Button>
        <Link href={dashboardHref}>
          <Button
            type="button"
            variant="outline"
            className={dark ? "border-white/15 bg-white/5 text-zinc-100 hover:border-emerald-400/40 hover:text-white" : undefined}
          >
            Go to Dashboard
          </Button>
        </Link>
        <Link href={homeHref}>
          <Button
            type="button"
            variant="outline"
            className={dark ? "border-white/15 bg-white/5 text-zinc-100 hover:border-emerald-400/40 hover:text-white" : undefined}
          >
            Go Home
          </Button>
        </Link>
        <Button
          type="button"
          variant="ghost"
          disabled={reported}
          onClick={reportIssue}
          className={dark ? "text-zinc-300 hover:bg-white/5 hover:text-white" : undefined}
        >
          {reported ? "Issue reported" : reportFailed ? "Report issue" : "Reporting…"}
        </Button>
      </div>
    </div>
  );
}
