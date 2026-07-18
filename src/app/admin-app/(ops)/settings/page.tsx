import Link from "next/link";
import { getServiceRoleServices } from "@/lib/services";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/design-system";
import { AdminFeatureFlags } from "@/components/admin/AdminFeatureFlags";
import { HomepageStatsAdmin } from "@/components/admin/HomepageStatsAdmin";
import { getBuildId } from "@/lib/build-id";
import { ADMIN_DOWNLOAD } from "@/lib/admin-app/constants";
import { formatBytes, getAdminReleaseMeta } from "@/lib/admin-app/release-meta";
import { DEFAULT_HOMEPAGE_STATS } from "@/lib/homepage/homepage-stats";

export const dynamic = "force-dynamic";

export default async function AdminAppSettingsPage() {
  const services = await getServiceRoleServices();
  const [announcement, withdrawalWindows, featureFlags, authSettings, homepageStats] = await Promise.all([
    services ? services.settings.getAnnouncement().catch(() => "") : Promise.resolve(""),
    services ? services.settings.getWithdrawalWindows().catch(() => "") : Promise.resolve(""),
    services ? services.settings.getFeatureFlags().catch(() => null) : Promise.resolve(null),
    services
      ? services.settings.getAuthSettings().catch(() => ({ trusted_device_days: 90 }))
      : Promise.resolve({ trusted_device_days: 90 }),
    services
      ? services.settings.getHomepageStats().catch(() => DEFAULT_HOMEPAGE_STATS)
      : Promise.resolve(DEFAULT_HOMEPAGE_STATS)
  ]);
  const release = getAdminReleaseMeta();
  const buildId = getBuildId();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">System</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Platform settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Feature flags, announcements, withdrawal windows, and release info.</p>
      </header>

      {featureFlags ? <AdminFeatureFlags initial={featureFlags} /> : null}

      <HomepageStatsAdmin initial={homepageStats} />

      <Card variant="elevated" padding="md" className="border-white/10 bg-zinc-900/80">
        <SectionHeading title="Platform announcements" />
        <p className="mb-4 text-sm text-zinc-400">
          Bank receiving accounts are managed on{" "}
          <Link href="/admin-app/funding-accounts" className="font-semibold text-emerald-400 hover:underline">
            Funding accounts
          </Link>
          .
        </p>
        <form action="/api/hard/platform-settings" method="post" className="grid gap-3">
          <label className="grid gap-1 text-sm text-zinc-300">
            Announcement
            <textarea
              name="globalAnnouncement"
              rows={3}
              className="field border-white/10 bg-zinc-950 text-white"
              defaultValue={announcement}
            />
          </label>
          <label className="grid gap-1 text-sm text-zinc-300">
            Withdrawal windows
            <input
              name="withdrawalWindows"
              className="field border-white/10 bg-zinc-950 text-white"
              defaultValue={withdrawalWindows}
            />
          </label>
          <label className="grid gap-1 text-sm text-zinc-300">
            Trusted device duration (days)
            <input
              name="trustedDeviceDays"
              type="number"
              min={7}
              max={365}
              className="field border-white/10 bg-zinc-950 text-white"
              defaultValue={authSettings.trusted_device_days ?? 90}
            />
          </label>
          <button type="submit" className="button">
            Save settings
          </button>
        </form>
      </Card>

      <Card variant="elevated" padding="md" className="border-white/10 bg-zinc-900/80">
        <SectionHeading title="About" />
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">App</dt>
            <dd className="mt-1 font-medium text-white">{release.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Package</dt>
            <dd className="mt-1 font-medium text-white">{release.packageId}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Version</dt>
            <dd className="mt-1 font-medium text-white">{release.versionName}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Build number</dt>
            <dd className="mt-1 font-medium text-white">{release.buildNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">BUILD_ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-zinc-300">{buildId}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">APK size</dt>
            <dd className="mt-1 font-medium text-white">{formatBytes(release.apkBytes)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500">
          Native APK download:{" "}
          <Link href={ADMIN_DOWNLOAD} className="text-emerald-400 hover:underline">
            {ADMIN_DOWNLOAD}
          </Link>
        </p>
      </Card>
    </div>
  );
}
