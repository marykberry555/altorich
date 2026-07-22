import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/errors/api-response";
import {
  createRequestId,
  getRequestId,
  runWithRequestContext,
  setRequestRoute,
  setRequestUserId
} from "@/lib/observability/request-context";
import { getSessionUser } from "@/lib/auth/session";

export type RouteContext = { params: Promise<Record<string, string>> };

function resolveRequestId(request: NextRequest): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  if (incoming && /^[\w-]{8,64}$/.test(incoming)) return incoming;
  return createRequestId();
}

function withRequestIdHeader(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function enrichContext(request: NextRequest, route?: string) {
  setRequestRoute(route ?? request.nextUrl.pathname);
  try {
    const user = await getSessionUser();
    if (user) setRequestUserId(user.id);
  } catch {
    // Session probe must never break the handler.
  }
}

/** Wrap simple API handlers (no dynamic params). */
export function withApiHandler(
  handler: (request: NextRequest) => Promise<Response>,
  route?: string
) {
  return async (request: NextRequest) => {
    const requestId = resolveRequestId(request);
    return runWithRequestContext(
      {
        requestId,
        route: route ?? request.nextUrl.pathname,
        environment: process.env.NODE_ENV
      },
      async () => {
        try {
          await enrichContext(request, route);
          const response = await handler(request);
          return withRequestIdHeader(response, requestId);
        } catch (error) {
          if (isNextRedirectError(error)) throw error;
          const errRes = await apiErrorResponse(error, {
            route: route ?? request.nextUrl.pathname,
            requestId: getRequestId() ?? requestId
          });
          return withRequestIdHeader(errRes, requestId);
        }
      }
    );
  };
}

/** Wrap dynamic-segment API handlers. */
export function withApiRouteHandler(
  handler: (request: NextRequest, context: RouteContext) => Promise<Response>,
  route?: string
) {
  return async (request: NextRequest, context: RouteContext) => {
    const requestId = resolveRequestId(request);
    return runWithRequestContext(
      {
        requestId,
        route: route ?? request.nextUrl.pathname,
        environment: process.env.NODE_ENV
      },
      async () => {
        try {
          await enrichContext(request, route);
          const response = await handler(request, context);
          return withRequestIdHeader(response, requestId);
        } catch (error) {
          if (isNextRedirectError(error)) throw error;
          const errRes = await apiErrorResponse(error, {
            route: route ?? request.nextUrl.pathname,
            requestId: getRequestId() ?? requestId
          });
          return withRequestIdHeader(errRes, requestId);
        }
      }
    );
  };
}
