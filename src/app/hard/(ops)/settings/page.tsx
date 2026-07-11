import Link from "next/link";
import { getServiceRoleServices } from "@/lib/services";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/design-system";
import { AdminFeatureFlags } from "@/components/admin/AdminFeatureFlags";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const services = await getServiceRoleServices();
  const announcement = services ? await services.settings.getAnnouncement() : "";
  const withdrawalWindows = services ? await services.settings.getWithdrawalWindows() : "";
  const featureFlags = services ? await services.settings.getFeatureFlags() : null;

  const authSettings = services ? await services.settings.getAuthSettings() : { trusted_device_days: 90 };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">System</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)]">Platform settings</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Feature flags, announcements, and payout windows.</p>
      </header>

      {featureFlags ? <AdminFeatureFlags initial={featureFlags} /> : null}

      <Card variant="elevated" padding="md">
        <SectionHeading title="Platform announcements" />
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Bank receiving accounts are managed on{" "}
          <Link href="/hard/funding-accounts" className="font-semibold text-[var(--emerald)] hover:underline">
            Funding accounts
          </Link>
          .
        </p>
        <form action="/api/hard/platform-settings" method="post" className="grid gap-3">
          <label className="grid gap-1 text-sm">
            Announcement
            <textarea name="globalAnnouncement" rows={3} className="field" defaultValue={announcement} />
          </label>
          <label className="grid gap-1 text-sm">
            Payout windows
            <input name="withdrawalWindows" className="field" defaultValue={withdrawalWindows} />
          </label>
          <label className="grid gap-1 text-sm">
            Trusted device duration (days)
            <input
              name="trustedDeviceDays"
              type="number"
              min={7}
              max={365}
              className="field"
              defaultValue={authSettings.trusted_device_days ?? 90}
            />
          </label>
          <button type="submit" className="button">
            Save settings
          </button>
        </form>
      </Card>
    </div>
  );
}
