import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { BankAccountsManager } from "@/components/settings/BankAccountsManager";
import { getUserServices } from "@/lib/services";
import { getSessionUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  let profile = null;
  let bankAccounts: Awaited<ReturnType<NonNullable<typeof services>["profile"]["listBankAccounts"]>> = [];

  if (user && services) {
    profile = await services.profile.getProfile(user.id).catch(() => null);
    bankAccounts = await services.profile.listBankAccounts(user.id).catch(() => []);
  }

  const prefs = (profile?.notification_preferences ?? { in_app: true, email: true, sms: false }) as {
    in_app: boolean;
    email: boolean;
    sms: boolean;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHero eyebrow="Settings" title="Account & security" description="Manage your profile, withdrawal details, and preferences." />

      <Card variant="elevated" className="mt-8">
        <h2 className="font-semibold text-[var(--heading)]">Profile & investment sector</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Update your details, location, or preferred investment sector.
        </p>
        <div className="mt-4">
          <ProfileSettingsForm
            initialName={profile?.full_name ?? ""}
            initialPhone={profile?.phone ?? ""}
            initialPreferredPackage={(profile?.preferred_package_slug as "starter" | "growth" | "premium" | "elite" | undefined) ?? ""}
            initialStateCode={profile?.location_state_code ?? null}
            initialCityArea={profile?.location_city_area ?? null}
            prefs={prefs}
          />
        </div>
      </Card>

      <Card variant="elevated" className="mt-4">
        <h2 className="font-semibold text-[var(--heading)]">Bank accounts</h2>
        <BankAccountsManager initialAccounts={bankAccounts} />
        <Link href="/withdrawals" className="mt-4 inline-block">
          <Button size="sm">Manage withdrawals</Button>
        </Link>
      </Card>

      <Card variant="elevated" className="mt-4">
        <h2 className="font-semibold text-[var(--heading)]">Security</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] px-4 py-3">
            <span className="text-sm font-medium">Change password</span>
            <Link href="/forgot-password">
              <Badge>Reset via email</Badge>
            </Link>
          </div>
        </div>
      </Card>

      <Card variant="elevated" className="mt-4">
        <h2 className="font-semibold text-[var(--heading)]">Session</h2>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}
