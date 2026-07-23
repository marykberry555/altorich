import { unknownErrorMessage } from "@/lib/errors";
import { recordSecondaryFailure } from "@/lib/resilience/secondary-failures";

/**
 * Run a secondary (non-ledger) side effect after a successful primary mutation.
 * Failures are recorded + logged and never thrown — they must not invalidate primary success.
 */
export async function runSecondary(
  label: string,
  work: () => Promise<unknown>,
  context?: Record<string, unknown>
): Promise<void> {
  try {
    await work();
  } catch (error) {
    recordSecondaryFailure(label, unknownErrorMessage(error), context);
  }
}
