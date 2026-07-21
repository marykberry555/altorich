"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TrustedDevicesManager, type TrustedDeviceRow } from "@/components/settings/TrustedDevicesManager";
import { SecurityStatusCard } from "./SecurityStatusCard";
import { LoginDeviceHistoryPanel } from "./LoginDeviceHistoryPanel";
import { LoginAlertsPanel } from "./LoginAlertsPanel";
import { TwoFactorPlaceholder } from "./TwoFactorPlaceholder";
import { ActiveSessionsPlaceholder } from "./ActiveSessionsPlaceholder";
import { formatFinancialDateTime } from "@/lib/financial-events/format";
import type { MemberSecuritySnapshot } from "@/lib/trust/types";

const SecurityTipsPanel = dynamic(() => import("./SecurityTipsPanel").then((m) => m.SecurityTipsPanel));
const AccountRecoveryPanel = dynamic(() => import("./AccountRecoveryPanel").then((m) => m.AccountRecoveryPanel));
const SecurityTimelinePanel = dynamic(() =>
  import("./SecurityTimelinePanel").then((m) => m.SecurityTimelinePanel)
);

type Props = {
  snapshot: MemberSecuritySnapshot;
  trustedDevices: TrustedDeviceRow[];
};

export function MemberSecurityCenter({ snapshot, trustedDevices }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SecurityStatusCard
          label="Email verification"
          value={snapshot.emailVerified ? "Verified" : "Not verified"}
          status={snapshot.emailVerified ? "good" : "warning"}
          hint={
            snapshot.emailVerifiedAt
              ? `Verified ${formatFinancialDateTime(snapshot.emailVerifiedAt)}`
              : "Check your inbox for a verification link."
          }
        />
        <SecurityStatusCard
          label="Password last changed"
          value={snapshot.passwordLastChanged ? formatFinancialDateTime(snapshot.passwordLastChanged) : "Not recorded"}
          status={snapshot.passwordLastChanged ? "neutral" : "unavailable"}
          hint={
            snapshot.passwordLastChanged
              ? "Based on recorded account changes."
              : "Change timestamps are shown when recorded in account activity."
          }
        />
        <SecurityStatusCard
          label="Recognised devices"
          value={String(snapshot.trustedDevices.length)}
          status="neutral"
          hint="Browsers verified for faster sign-in."
        />
      </div>

      <LoginAlertsPanel enabled={snapshot.loginAlertsEnabled} />
      <LoginDeviceHistoryPanel rows={snapshot.recentLogins} />
      <ActiveSessionsPlaceholder />

      <section aria-labelledby="trusted-devices-heading">
        <h2 id="trusted-devices-heading" className="sr-only">
          Trusted devices
        </h2>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[var(--emerald)]" aria-hidden />
            <h3 className="font-semibold text-[var(--heading)]">Trusted device management</h3>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Remove devices you no longer use. Future session controls will extend this section.
          </p>
          <TrustedDevicesManager initialDevices={trustedDevices} />
        </div>
      </section>

      <TwoFactorPlaceholder />
      <SecurityTimelinePanel
        events={snapshot.timeline}
        exportHref="/api/member/statements/transactions"
        compact
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SecurityTipsPanel />
        <AccountRecoveryPanel />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/security/activity">
          <Button variant="outline">Full activity timeline</Button>
        </Link>
        <Link href="/settings">
          <Button variant="ghost">Account settings</Button>
        </Link>
        <Link href="/privacy">
          <Button variant="ghost">Privacy centre</Button>
        </Link>
      </div>

      <form action="/api/auth/logout" method="post">
        <Button type="submit" variant="outline">
          Sign out on this device
        </Button>
      </form>
    </div>
  );
}
