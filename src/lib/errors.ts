import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code?: string,
    public readonly userMessage?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function apiErrorResponse(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (isAppError(error)) {
    logger.warn(error.message, { status: error.status, code: error.code });
    return NextResponse.json(
      { error: error.userMessage ?? error.message, code: error.code },
      { status: error.status }
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  logger.error("Unhandled API error", { message });
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export const Errors = {
  notConfigured: () =>
    new AppError(
      "Supabase is not configured",
      503,
      "NOT_CONFIGURED",
      "The platform is not fully configured. Please try again later."
    ),
  unauthorized: () =>
    new AppError("Authentication required", 401, "UNAUTHORIZED", "Please sign in to continue."),
  forbidden: () =>
    new AppError("Insufficient permissions", 403, "FORBIDDEN", "You do not have permission to perform this action."),
  badRequest: (message: string) => new AppError(message, 400, "BAD_REQUEST", message),
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, "NOT_FOUND", `${resource} was not found.`),
  conflict: (message: string) => new AppError(message, 409, "CONFLICT", message),
  internal: () =>
    new AppError("Internal server error", 500, "INTERNAL", "Something went wrong. Please try again.")
};
