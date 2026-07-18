import { logger } from "@/lib/logger";
import { classifyThrownError, memberCopyForCategory } from "@/lib/errors/taxonomy";

export type RouteErrorContext = {
  route: string;
  component?: string;
  function?: string;
  userId?: string | null;
  digest?: string;
};

export function logRouteError(error: unknown, context: RouteErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error("Route render failure", {
    route: context.route,
    component: context.component,
    function: context.function,
    userId: context.userId ?? undefined,
    digest: context.digest,
    message: err.message,
    stack: err.stack,
    category: classifyThrownError(err)
  });
}

/** Safe member-facing copy for route boundaries (never raw exception text). */
export function errorMessage(error: unknown, fallback?: string) {
  const category = classifyThrownError(error);
  if (fallback) return fallback;
  return memberCopyForCategory(category).body;
}
