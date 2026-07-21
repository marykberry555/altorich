import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";

type ProfileSummary = {
  fullName: string;
  emailVerified: boolean;
  phone?: string | null;
  notificationPrefs: { in_app: boolean; email: boolean; sms: boolean };
};

type Props = {
  profile: ProfileSummary;
};

export function PrivacyCenterContent({ profile }: Props) {
  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Your profile data</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Full name</dt>
            <dd className="font-medium">{profile.fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Email status</dt>
            <dd>
              <Badge variant={profile.emailVerified ? "emerald" : "gold"}>
                {profile.emailVerified ? "Verified" : "Not verified"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--text-subtle)]">Phone</dt>
            <dd className="font-medium">{profile.phone?.trim() ? profile.phone : "Not provided"}</dd>
          </div>
        </dl>
        <Link href="/settings" className="mt-4 inline-block">
          <Button size="sm" variant="outline">
            Update profile
          </Button>
        </Link>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Communication preferences</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>In-app notifications</span>
            <Badge variant={profile.notificationPrefs.in_app ? "emerald" : "default"}>
              {profile.notificationPrefs.in_app ? "On" : "Off"}
            </Badge>
          </li>
          <li className="flex justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>Email notifications</span>
            <Badge variant={profile.notificationPrefs.email ? "emerald" : "default"}>
              {profile.notificationPrefs.email ? "On" : "Off"}
            </Badge>
          </li>
          <li className="flex justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>SMS notifications</span>
            <Badge variant={profile.notificationPrefs.sms ? "emerald" : "default"}>
              {profile.notificationPrefs.sms ? "On" : "Off"}
            </Badge>
          </li>
        </ul>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Security notifications</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Manage sign-in alerts and trusted devices from the{" "}
          <Link href="/security" className="font-semibold text-[var(--emerald)] hover:underline">
            Security Center
          </Link>
          .
        </p>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Marketing preferences</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Product updates and promotional messages respect your email notification setting above. Granular marketing
          controls will be added in a future release.
        </p>
        <Badge className="mt-3">Future-ready</Badge>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Download requests</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          You can export wallet transaction history today. A full personal data export request workflow is planned.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href="/api/member/statements/transactions">
            <Button size="sm" variant="outline">
              Export transactions (CSV)
            </Button>
          </a>
        </div>
      </Card>

      <Card variant="elevated" padding="md">
        <h2 className="font-semibold text-[var(--heading)]">Data deletion</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Account closure and data deletion requests are handled manually to meet regulatory retention requirements.
          Email {COMPANY.supportEmail} with subject &quot;Data Deletion Request&quot; and include your registered full name and
          username.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          See our{" "}
          <Link href="/legal/privacy" className="font-semibold text-[var(--emerald)] hover:underline">
            Privacy Policy
          </Link>{" "}
          for retention periods and your rights.
        </p>
      </Card>
    </div>
  );
}
