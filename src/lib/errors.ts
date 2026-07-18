import type { ErrorCategory, ErrorNextAction } from "@/lib/errors/taxonomy";

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
