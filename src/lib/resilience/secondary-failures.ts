import { logger } from "@/lib/logger";

export type SecondaryFailureRecord = {
  label: string;
  message: string;
  at: string;
  context?: Record<string, unknown>;
};

/**
 * In-process secondary failure buffer for diagnostics and chaos tests.
 * Durable retry/outbox is a follow-up; this proves failures are observed.
 */
const buffer: SecondaryFailureRecord[] = [];
const MAX_BUFFER = 200;

export function recordSecondaryFailure(
  label: string,
  message: string,
  context?: Record<string, unknown>
): void {
  const entry: SecondaryFailureRecord = {
    label,
    message,
    at: new Date().toISOString(),
    context
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
  logger.error("Secondary operation failed (fail-soft)", {
    label,
    message,
    ...context
  });
}

/** Test / ops helper — drain observed secondary failures. */
export function drainSecondaryFailures(): SecondaryFailureRecord[] {
  return buffer.splice(0, buffer.length);
}

export function peekSecondaryFailures(): readonly SecondaryFailureRecord[] {
  return buffer;
}
