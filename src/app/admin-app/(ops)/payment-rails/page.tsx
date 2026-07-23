import { getServiceRoleServices } from "@/lib/services";
import { PaymentRailsAdminPanel } from "@/components/admin/PaymentRailsAdminPanel";
import { mergePaymentRails } from "@/lib/payments/payment-rails";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPaymentRailsPage() {
  const services = await getServiceRoleServices();
  const resolved = services
    ? await services.paymentRails.getResolved().catch(() => mergePaymentRails(null))
    : mergePaymentRails(null);
  const live = services ? await services.paymentRails.getLiveState().catch(() => ({ version: 1 as const })) : { version: 1 as const };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Payments</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Payment rails</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Enable bank or crypto with four switches. Crypto unlocks the fixed USDT / USDC / BTC / ETH catalog and
          receive addresses. Bank accounts stay on{" "}
          <Link href="/admin-app/funding-accounts" className="font-semibold text-emerald-400 hover:underline">
            Funding accounts
          </Link>
          .
        </p>
      </header>

      <PaymentRailsAdminPanel initialResolved={resolved} initialLive={live} />
    </div>
  );
}
