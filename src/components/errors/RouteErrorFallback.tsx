"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { logRouteError } from "@/lib/observability/route-error";
import { isChunkLoadFailure, recoverFromChunkFailure } from "@/lib/cache/chunk-recovery";
import {
  classifyThrownError,
  memberCopyForCategory,
  type ErrorCategory
} from "@/lib/errors/taxonomy";
import { COMPANY } from "@/lib/company";
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
  /** Force a category when the boundary knows the failure mode. */
  category?: ErrorCategory;
};

export function RouteErrorFallback({
  error,
  reset,
  route,
  component = "RouteErrorBoundary",
  dashboardHref = "/dashboard",
  homeHref = "/",
  showDebugDetails = process.env.NODE_ENV !== "production",
  tone = "default",
  category: categoryOverride
}: Props) {
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const dark = tone === "dark" || route.startsWith("/admin") || route.startsWith("/hard");

  const isChunk = isChunkLoadFailure(error.message);
  const category = categoryOverride ?? (isChunk ? "network" : classifyThrownError(error));
  const copy = isChunk ? memberCopyForCategory("network", "chunk") : memberCopyForCategory(category);

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
        category,
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
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { referenceId?: string; ok?: boolean };
        if (body.referenceId) setReferenceId(body.referenceId);
        if (res.ok) setReported(true);
      })
      .catch(() => {
        /* reporting must never break the fallback UI */
      });
  }, [error, route, component, category]);

  const actions = copy.nextActions.map((action) => {
    if (action.action === "retry") {
      return (
        <Button
          key="retry"
          type="button"
          onClick={() => {
            if (isChunk) {
              window.location.reload();
              return;
            }
            reset();
          }}
        >
          {action.label}
        </Button>
      );
    }
    if (action.action === "signin" || action.href === "/login") {
      return (
        <Link key="signin" href="/login">
          <Button type="button">{action.label}</Button>
        </Link>
      );
    }
    if (action.action === "support" || action.href === "/contact") {
      return (
        <a key="support" href={`mailto:${COMPANY.supportEmail}`}>
          <Button
            type="button"
            variant="outline"
            className={dark ? "border-white/15 bg-white/5 text-zinc-100 hover:border-emerald-400/40 hover:text-white" : undefined}
          >
            {action.label}
          </Button>
        </a>
      );
    }
    const href = action.href === "/dashboard" ? dashboardHref : action.href || homeHref;
    return (
      <Link key={href} href={href}>
        <Button
          type="button"
          variant="outline"
          className={dark ? "border-white/15 bg-white/5 text-zinc-100 hover:border-emerald-400/40 hover:text-white" : undefined}
        >
          {action.label}
        </Button>
      </Link>
    );
  });

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center",
        dark && "rounded-2xl border border-white/10 bg-zinc-950"
      )}
    >
      <h1 className={cn("text-xl font-bold", dark ? "text-white" : "text-[var(--heading)]")}>{copy.title}</h1>
      <p className={cn("max-w-md text-sm leading-relaxed", dark ? "text-zinc-300" : "text-[var(--text-muted)]")}>
        {copy.body}
      </p>
      {referenceId || error.digest ? (
        <p className={cn("font-mono text-xs", dark ? "text-zinc-500" : "text-[var(--text-subtle)]")}>
          Reference ID: {referenceId ?? `AR-${String(error.digest).slice(0, 6).toUpperCase()}`}
        </p>
      ) : reported ? null : (
        <p className={cn("text-xs", dark ? "text-zinc-500" : "text-[var(--text-subtle)]")}>Logging this issue…</p>
      )}
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
      <div className="flex flex-wrap justify-center gap-2">{actions}</div>
    </div>
  );
}
