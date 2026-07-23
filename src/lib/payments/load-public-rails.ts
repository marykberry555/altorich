import "server-only";

import { logger } from "@/lib/logger";
import { getServiceRoleServices, getUserServices } from "@/lib/services";
import { mergePaymentRails, toPublicPaymentRailsSnapshot, type PublicPaymentRailsSnapshot } from "@/lib/payments/payment-rails";

/** Public payment-rails snapshot for member UI — prefer service role so RLS never hides live toggles. */
export async function loadPublicPaymentRailsSnapshot(): Promise<PublicPaymentRailsSnapshot> {
  const fallback = () => toPublicPaymentRailsSnapshot(mergePaymentRails(null));

  try {
    const privileged = await getServiceRoleServices();
    if (privileged) return await privileged.paymentRails.getPublicSnapshot();
  } catch (error) {
    logger.warn("Payment rails snapshot via service role failed", {
      message: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    const userScoped = await getUserServices();
    if (userScoped) return await userScoped.paymentRails.getPublicSnapshot();
  } catch (error) {
    logger.warn("Payment rails snapshot via user client failed", {
      message: error instanceof Error ? error.message : String(error)
    });
  }

  return fallback();
}
