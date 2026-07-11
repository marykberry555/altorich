import { logger } from "@/lib/logger";

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
    stack: err.stack
  });
}

export function errorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
