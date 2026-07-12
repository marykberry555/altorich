"use client";

import { useEffect } from "react";

type ErrorPayload = {
  kind: "window-error" | "unhandledrejection" | "api-failure" | "admin-route";
  message: string;
  stack?: string;
  route?: string;
  status?: number;
  url?: string;
};

function deviceContext() {
  if (typeof navigator === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    standalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    online: navigator.onLine
  };
}

function report(payload: ErrorPayload) {
  try {
    const body = JSON.stringify({
      ...payload,
      route: payload.route ?? window.location.pathname,
      component: "GlobalCrashReporter",
      device: deviceContext(),
      at: new Date().toISOString()
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/client-error", blob);
      return;
    }
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    });
  } catch {
    // Never throw from the crash reporter
  }
}

/** Production crash reporter — unhandled errors, promise rejections, optional API hooks. */
export function GlobalCrashReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report({
        kind: "window-error",
        message: event.message || "Unhandled error",
        stack: event.error instanceof Error ? event.error.stack : undefined
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      report({ kind: "unhandledrejection", message, stack });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // Expose a small helper for fetch wrappers / admin routes
    (window as Window & { __altorichReportError?: typeof report }).__altorichReportError = report;

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      delete (window as Window & { __altorichReportError?: typeof report }).__altorichReportError;
    };
  }, []);

  return null;
}

export function reportApiFailure(url: string, status: number, message?: string) {
  report({
    kind: "api-failure",
    message: message ?? `API ${status}`,
    url,
    status,
    route: typeof window !== "undefined" ? window.location.pathname : undefined
  });
}
