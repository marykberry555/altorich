import { getServiceRoleServices } from "@/lib/services";
import { getPublicEnv } from "@/lib/env";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/design-system";
import { RoiAdminControls } from "@/components/admin/RoiAdminControls";

export const dynamic = "force-dynamic";

export default async function SettlementsPage() {
  const services = await getServiceRoleServices();
  const env = getPublicEnv();
  const roiEnabled = Boolean(env.NEXT_PUBLIC_ROI_MODE_ENABLED);
  const roiExchange = services ? await services.settings.get<{ ngn_per_usd?: number }>("roi_exchange_rate") : null;
  const roiPayoutDest = services
    ? await services.settings.get<{ bank_enabled?: boolean; crypto_enabled?: boolean; crypto_address?: string }>("roi_payout_destinations")
    : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">Operations</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Settlements & ROI</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Run settlement cycles and manage ROI payout controls.</p>
      </header>

      <Card variant="elevated" padding="md">
        <SectionHeading
          title="Settlement engine"
          description="Process due settlements and mature completed investments. Credits wallet via ledger."
        />
        <form action="/api/admin/settlements/process" method="post">
          <button type="submit" className="button">
            Run settlement cycle
          </button>
        </form>
      </Card>

      {roiEnabled ? (
        <RoiAdminControls
          exchangeRateNgnPerUsd={Number(roiExchange?.ngn_per_usd ?? 1600)}
          bankEnabled={Boolean(roiPayoutDest?.bank_enabled ?? true)}
          cryptoEnabled={Boolean(roiPayoutDest?.crypto_enabled ?? true)}
          cryptoAddress={String(roiPayoutDest?.crypto_address ?? "")}
        />
      ) : (
        <Card variant="elevated" padding="md">
          <p className="text-sm text-[var(--text-muted)]">ROI mode is not enabled for this environment.</p>
        </Card>
      )}
    </div>
  );
}
