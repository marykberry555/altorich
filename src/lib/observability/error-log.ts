import "server-only";

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { makeErrorReference, type ErrorCategory } from "@/lib/errors/taxonomy";
import type { Database, Json } from "@/types/database";

export type PersistErrorInput = {
  category: ErrorCategory;
  message: string;
  userMessage?: string;
  code?: string;
  userId?: string | null;
  route?: string;
  action?: string;
  requestId?: string;
  correlationId?: string;
  environment?: string;
  browser?: string;
  device?: string;
  userAgent?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  referenceId?: string;
};

export type PersistedError = {
  referenceId: string;
  id?: string;
};

function createErrorLogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Persist an unexpected error for admin review. Never throws to callers.
 * Members should only ever see `referenceId`.
 */
export async function persistApplicationError(input: PersistErrorInput): Promise<PersistedError> {
  const referenceId = input.referenceId ?? makeErrorReference();
  const environment =
    input.environment ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "unknown";

  logger.error("Application error", {
    referenceId,
    category: input.category,
    message: input.message,
    code: input.code,
    userId: input.userId ?? undefined,
    route: input.route,
    action: input.action,
    requestId: input.requestId,
    correlationId: input.correlationId
  });

  try {
    const supabase = createErrorLogClient();
    if (!supabase) return { referenceId };

    const { data, error } = await supabase
      .from("application_errors")
      .insert({
        reference_id: referenceId,
        category: input.category,
        status: "open",
        message: input.message.slice(0, 4000),
        user_message: input.userMessage?.slice(0, 1000) ?? null,
        code: input.code ?? null,
        user_id: input.userId ?? null,
        route: input.route ?? null,
        action: input.action ?? null,
        request_id: input.requestId ?? null,
        correlation_id: input.correlationId ?? referenceId,
        environment,
        browser: input.browser ?? null,
        device: input.device ?? null,
        user_agent: input.userAgent ?? null,
        stack: input.stack?.slice(0, 8000) ?? null,
        metadata: (input.metadata ?? {}) as Json
      })
      .select("id")
      .single();

    if (error) {
      logger.error("Failed to persist application error", {
        referenceId,
        message: error.message
      });
      return { referenceId };
    }

    return { referenceId, id: data?.id };
  } catch (error) {
    logger.error("Failed to persist application error", {
      referenceId,
      message: error instanceof Error ? error.message : String(error)
    });
    return { referenceId };
  }
}
