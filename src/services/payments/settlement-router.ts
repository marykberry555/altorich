import type { PaymentRailsService } from "@/services/payments/payment-rails.service";
import { readPayoutPreferences } from "@/lib/payments/member-destinations";
import type { SettlementMethod } from "@/lib/payments/payment-rails";

/**
 * Settlement payout routing — picks bank vs crypto from live rails + member preference.
 * Never silently falls back to a disabled rail.
 */
export async function resolveSettlementPayoutRail(
  paymentRails: PaymentRailsService,
  notificationPreferences: unknown,
  investmentPayoutMethod?: string | null
): Promise<{ method: SettlementMethod; reason: string } | { method: null; reason: string }> {
  const prefs = readPayoutPreferences(notificationPreferences);
  const preferred =
    (investmentPayoutMethod === "crypto" || investmentPayoutMethod === "bank"
      ? investmentPayoutMethod
      : null) ?? prefs.preferredMethod ?? null;

  const routed = await paymentRails.routeSettlement(preferred);
  if (!routed.method) {
    return { method: null, reason: routed.reason };
  }
  return { method: routed.method, reason: routed.reason };
}
