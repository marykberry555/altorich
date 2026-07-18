import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { persistApplicationError } from "@/lib/observability/error-log";
import {
  classifyAppErrorCode,
  type ErrorCategory,
  type ErrorNextAction
} from "@/lib/errors/taxonomy";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code?: string,
    public readonly userMessage?: string,
    public readonly category?: ErrorCategory,
    public readonly nextAction?: ErrorNextAction
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

type ApiErrorOptions = {
  route?: string;
  action?: string;
  userId?: string | null;
  requestId?: string;
  fallback?: string;
};

export async function apiErrorResponse(error: unknown, options: ApiErrorOptions | string = {}) {
  const opts: ApiErrorOptions = typeof options === "string" ? { fallback: options } : options;
  const fallback =
    opts.fallback ??
    "We're sorry — an unexpected error occurred. Our team has been notified. Your request has not been processed.";

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Invalid request data.";
    return NextResponse.json(
      {
        error: message,
        code: "VALIDATION",
        category: "validation" as ErrorCategory
      },
      { status: 400 }
    );
  }

  if (isAppError(error)) {
    const category = error.category ?? classifyAppErrorCode(error.code, error.status);
    const isUnexpected = error.status >= 500 && category === "server";

    if (isUnexpected) {
      const persisted = await persistApplicationError({
        category,
        message: error.message,
        userMessage: error.userMessage,
        code: error.code,
        userId: opts.userId,
        route: opts.route,
        action: opts.action,
        requestId: opts.requestId,
        stack: error.stack
      });

      return NextResponse.json(
        {
          error: error.userMessage ?? fallback,
          code: error.code,
          category,
          referenceId: persisted.referenceId,
          ...(error.nextAction ? { nextAction: error.nextAction } : {})
        },
        { status: error.status }
      );
    }

    logger.warn(error.message, { status: error.status, code: error.code, category });
    return NextResponse.json(
      {
        error: error.userMessage ?? error.message,
        code: error.code,
        category,
        ...(error.nextAction ? { nextAction: error.nextAction } : {})
      },
      { status: error.status }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  if (message.includes("not configured") || message.includes("User not allowed")) {
    return NextResponse.json(
      {
        error: "The platform is not fully configured. Please contact support.",
        code: "NOT_CONFIGURED",
        category: "network" as ErrorCategory
      },
      { status: 503 }
    );
  }

  if (/row-level security|permission denied|42501/i.test(message)) {
    const persisted = await persistApplicationError({
      category: "server",
      message,
      code: "PERMISSION_DENIED",
      userId: opts.userId,
      route: opts.route,
      action: opts.action,
      requestId: opts.requestId,
      stack
    });

    return NextResponse.json(
      {
        error: "Unable to complete this request. Please contact support if the problem continues.",
        code: "PERMISSION_DENIED",
        category: "server" as ErrorCategory,
        referenceId: persisted.referenceId
      },
      { status: 500 }
    );
  }

  const persisted = await persistApplicationError({
    category: "server",
    message,
    userMessage: fallback,
    code: "INTERNAL",
    userId: opts.userId,
    route: opts.route,
    action: opts.action,
    requestId: opts.requestId,
    stack
  });

  return NextResponse.json(
    {
      error: fallback,
      code: "INTERNAL",
      category: "server" as ErrorCategory,
      referenceId: persisted.referenceId
    },
    { status: 500 }
  );
}

export const Errors = {
  notConfigured: () =>
    new AppError(
      "Supabase is not configured",
      503,
      "NOT_CONFIGURED",
      "The platform is not fully configured. Please try again later.",
      "network"
    ),
  unauthorized: () =>
    new AppError(
      "Authentication required",
      401,
      "UNAUTHORIZED",
      "Your session has expired. Please sign in again.",
      "authentication",
      { label: "Sign In", href: "/login", action: "signin" }
    ),
  forbidden: () =>
    new AppError(
      "Insufficient permissions",
      403,
      "FORBIDDEN",
      "You do not have permission to perform this action.",
      "authentication"
    ),
  badRequest: (message: string) => new AppError(message, 400, "BAD_REQUEST", message, "validation"),
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, "NOT_FOUND", `${resource} was not found.`, "not_found"),
  conflict: (message: string, nextAction?: ErrorNextAction) =>
    new AppError(message, 409, "CONFLICT", message, "business", nextAction),
  business: (message: string, code = "BUSINESS_RULE", nextAction?: ErrorNextAction) =>
    new AppError(message, 409, code, message, "business", nextAction),
  internal: () =>
    new AppError(
      "Internal server error",
      500,
      "INTERNAL",
      "We're sorry — an unexpected error occurred. Our team has been notified. Your request has not been processed.",
      "server"
    )
};
