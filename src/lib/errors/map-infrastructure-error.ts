import { AppError, unknownErrorMessage } from "@/lib/errors";

type PostgrestLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function asPostgrest(error: unknown): PostgrestLike | null {
  if (!error || typeof error !== "object") return null;
  const e = error as PostgrestLike;
  if (typeof e.message !== "string" && typeof e.code !== "string") return null;
  return e;
}

/**
 * Map thrown PostgREST / Postgres / common infra failures to AppError so they
 * never fall through as opaque INTERNAL "[object Object]" responses.
 * Returns null when the error should keep flowing to generic handling.
 */
export function mapInfrastructureError(error: unknown): AppError | null {
  if (error instanceof AppError) return null;

  const pg = asPostgrest(error);
  const message = unknownErrorMessage(error);
  const code = typeof pg?.code === "string" ? pg.code : "";

  // Invalid UUID / bad input (often programming misuse of entity_id)
  if (code === "22P02" || /invalid input syntax for type uuid/i.test(message)) {
    return new AppError(
      message,
      500,
      "DATA_INTEGRITY",
      "We could not complete that save because of a data integrity issue. Please try again or contact support.",
      "server"
    );
  }

  // Unique violation
  if (code === "23505" || /duplicate key|unique constraint/i.test(message)) {
    return new AppError(
      message,
      409,
      "CONFLICT",
      "This change conflicts with an existing record. Refresh and try again.",
      "business"
    );
  }

  // Foreign key
  if (code === "23503" || /foreign key/i.test(message)) {
    return new AppError(
      message,
      409,
      "CONFLICT",
      "This change references something that no longer exists. Refresh and try again.",
      "business"
    );
  }

  // Check constraint / not-null
  if (code === "23514" || code === "23502") {
    return new AppError(
      message,
      400,
      "VALIDATION",
      "Some of the submitted data is invalid. Check your entries and try again.",
      "validation"
    );
  }

  // RLS / permission
  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return new AppError(
      message,
      403,
      "FORBIDDEN",
      "You do not have permission to complete this action.",
      "authentication"
    );
  }

  // PostgREST no rows for .single()
  if (code === "PGRST116" || /JSON object requested, multiple \(or no\) rows/i.test(message)) {
    return new AppError(
      message,
      404,
      "NOT_FOUND",
      "The requested record was not found.",
      "not_found"
    );
  }

  return null;
}
