import { logger } from "@/lib/logger";

type QueryError = { message?: string; code?: string; details?: string } | null;

export function logQueryFailure(
  context: { route?: string; component?: string; fn: string; userId?: string | null },
  error: unknown,
  meta?: Record<string, unknown>
) {
  const err = error as QueryError;
  logger.error("Supabase query failed", {
    route: context.route,
    component: context.component,
    function: context.fn,
    userId: context.userId ?? undefined,
    code: err?.code,
    details: err?.details,
    message: err?.message ?? (error instanceof Error ? error.message : String(error)),
    ...meta
  });
}

export async function safeQuery<T>(
  context: { route?: string; component?: string; fn: string; userId?: string | null },
  run: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    logQueryFailure(context, error);
    return fallback;
  }
}

export function fromSupabase<T>(
  context: { route?: string; component?: string; fn: string; userId?: string | null },
  result: { data: T | null; error: QueryError },
  fallback: T
): T {
  if (result.error) {
    logQueryFailure(context, result.error);
    return fallback;
  }
  return (result.data ?? fallback) as T;
}
