import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";

const DEV_HOST = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

function isDevHost(host: string) {
  return DEV_HOST.test(host.trim());
}

function configuredSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (!isDevHost(url.host)) return url.origin;
    } catch {
      // fall through
    }
  }
  return COMPANY.siteUrl.replace(/\/$/, "");
}

/**
 * Resolve the public site origin for redirects behind cPanel / Passenger / proxies.
 * Never returns localhost, 127.0.0.1, or 0.0.0.0 — those break logout and auth flows in production.
 */
export function getPublicOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  const host = request.headers.get("host")?.trim();

  if (forwardedHost && !isDevHost(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (host && !isDevHost(host)) {
    const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  try {
    const requestOrigin = new URL(request.url).origin;
    const requestHost = new URL(request.url).host;
    if (!isDevHost(requestHost)) return requestOrigin;
  } catch {
    // fall through
  }

  return configuredSiteOrigin();
}

export function buildPublicUrl(path: string, request: Request): URL {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, getPublicOrigin(request));
}

export function redirectToPath(path: string, request: Request, status = 302) {
  return NextResponse.redirect(buildPublicUrl(path, request), status);
}

/** Prevent open redirects — only allow same-site relative paths. */
export function safeRedirectPath(value: string | null, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
