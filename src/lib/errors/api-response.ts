import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";
import { persistApplicationError } from "@/lib/observability/error-log";
import { AppError, isAppError } from "@/lib/errors";
import { classifyAppErrorCode, type ErrorCategory } from "@/lib/errors/taxonomy";

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
