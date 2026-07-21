"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";
import { Button } from "@/components/ui/Button";
import { logRouteError } from "@/lib/observability/route-error";
import {
  chunkRecoveryAlreadyTried,
  isChunkLoadFailure,
  recoverFromChunkFailure,
  safeRecoveryHref
} from "@/lib/cache/chunk-recovery";
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
  tone?: "default" | "dark";
  category?: ErrorCategory;
};

/**
 * Premium recovery surface — never exposes framework wording.
 * Chunk / deploy mismatches auto-recover silently with a calm refresh state.
 */
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
  const dark = tone === "dark" || route.startsWith("/admin") || route.startsWith("/hard");
  const isChunk = isChunkLoadFailure(error.message);
  const [phase, setPhase] = useState<"recovering" | "ready">(isChunk ? "recovering" : "ready");
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const category = categoryOverride ?? (isChunk ? "network" : classifyThrownError(error));
  const copy = isChunk
    ? memberCopyForCategory("network", "refreshing")
    : memberCopyForCategory(category);

  useEffect(() => {
    logRouteError(error, { route, component, digest: error.digest });

    if (isChunkLoadFailure(error.message)) {
      setPhase("recovering");
      if (!chunkRecoveryAlreadyTried()) {
        void recoverFromChunkFailure(error.message);
        return;
      }
      // Already attempted once this session — soft-land without leaving a broken screen.
      const timer = window.setTimeout(() => {
        window.location.replace(safeRecoveryHref(window.location.pathname || route));
      }, 600);
      return () => window.clearTimeout(timer);
    }

    // Soft auto-retry once for transient server digests.
    if (category === "server" && error.digest) {
      const key = `altorich:soft-reset:${error.digest}`;
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          const timer = window.setTimeout(() => reset(), 900);
          return () => window.clearTimeout(timer);
        }
      } catch {
        /* ignore */
      }
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
        const body = (await res.json().catch(() => ({}))) as { referenceId?: string };
        if (body.referenceId) setReferenceId(body.referenceId);
      })
      .catch(() => undefined);

    setPhase("ready");
  }, [error, route, component, category, reset]);

  const actions = copy.nextActions.map((action, index) => {
    if (action.action === "retry") {
      return (
        <Button
          key={`retry-${index}`}
          type="button"
          onClick={() => {
            window.location.assign(window.location.pathname || homeHref);
          }}
        >
          {action.label}
        </Button>
      );
    }
    if (action.action === "signin" || action.href === "/auth/login" || action.href === "/login") {
      return (
        <a key={`signin-${index}`} href="/auth/login">
          <Button type="button">{action.label}</Button>
        </a>
      );
    }
    if (action.action === "support" || action.href === "/contact") {
      return (
        <a key={`support-${index}`} href={`mailto:${COMPANY.supportEmail}`}>
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
    const href =
      action.action === "dashboard" || action.href === "/dashboard"
        ? dashboardHref
        : action.action === "home" || action.href === "/"
          ? homeHref
          : action.href || homeHref;
    return (
      <Link key={`${href}-${index}`} href={href}>
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
      role="status"
      aria-live="polite"
      className={cn(
        "mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-5 px-4 py-12 text-center",
        dark && "rounded-2xl border border-white/10 bg-zinc-950"
      )}
    >
      <BrandLogoStatic variant="icon" href={homeHref} />
      <div className="space-y-2">
        <h1 className={cn("text-xl font-bold tracking-tight", dark ? "text-white" : "text-[var(--heading)]")}>
          {copy.title}
        </h1>
        <p className={cn("text-sm leading-relaxed", dark ? "text-zinc-300" : "text-[var(--text-muted)]")}>
          {copy.body}
        </p>
      </div>

      {phase === "recovering" ? (
        <div
          className={cn(
            "h-1 w-40 overflow-hidden rounded-full",
            dark ? "bg-white/10" : "bg-[var(--gray-200)]"
          )}
          aria-hidden
        >
          <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--emerald)]" />
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">{actions}</div>
      )}

      {referenceId && phase === "ready" && !isChunk ? (
        <p className={cn("font-mono text-[10px]", dark ? "text-zinc-600" : "text-[var(--text-subtle)]")}>
          Ref {referenceId}
        </p>
      ) : null}

      {showDebugDetails && error.stack && phase === "ready" ? (
        <pre
          className={cn(
            "max-h-48 w-full overflow-auto rounded-lg border p-3 text-left text-[11px] leading-relaxed",
            dark
              ? "border-white/10 bg-zinc-900 text-zinc-300"
              : "border-[var(--border)] bg-[var(--gray-50)] text-[var(--text-muted)]"
          )}
        >
          {error.stack}
        </pre>
      ) : null}
    </div>
  );
}
