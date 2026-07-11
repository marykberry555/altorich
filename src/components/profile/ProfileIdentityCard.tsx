"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { getPackageTitle } from "@/lib/packages/package-config";
import type { PackageSlug } from "@/content/packages";

type Props = {
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  packageSlug: string | null;
  memberSince: string | null;
  emailVerifiedAt: string | null;
  kycStatus: string | null;
  inviteCode: string | null;
};

function verificationLabel(emailVerifiedAt: string | null, kycStatus: string | null) {
  if (kycStatus === "approved") return { label: "Verified", variant: "emerald" as const };
  if (emailVerifiedAt) return { label: "Email verified", variant: "gold" as const };
  return { label: "Pending verification", variant: "outline" as const };
}

export function ProfileIdentityCard({
  fullName,
  username,
  avatarUrl,
  packageSlug,
  memberSince,
  emailVerifiedAt,
  kycStatus,
  inviteCode
}: Props) {
  const verification = verificationLabel(emailVerifiedAt, kycStatus);
  const packageTitle = packageSlug ? getPackageTitle(packageSlug as PackageSlug) : "Not selected";
  const since = memberSince
    ? new Date(memberSince).toLocaleDateString("en-NG", { month: "long", year: "numeric" })
    : "—";

  return (
    <Card
      variant="elevated"
      className="overflow-hidden border-[var(--emerald)]/20 bg-gradient-to-br from-[var(--emerald-soft)]/40 via-[var(--surface-raised)] to-[var(--surface-raised)] p-0"
    >
      <div className="border-b border-[var(--border)]/80 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <AvatarUpload fullName={fullName} avatarUrl={avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Member profile</p>
              <h2 className="mt-1 truncate text-xl font-bold text-[var(--heading)]">{fullName}</h2>
              <p className="truncate text-sm font-medium text-[var(--emerald)]">@{username ?? "member"}</p>
            </div>
          </div>
          <Badge variant={verification.variant}>{verification.label}</Badge>
        </div>
      </div>

      <dl className="grid gap-px bg-[var(--border)]/60 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Package", value: packageTitle },
          { label: "Member since", value: since },
          { label: "Referral code", value: inviteCode ?? "—" }
        ].map((item) => (
          <div key={item.label} className="bg-[var(--surface-raised)] px-5 py-4 sm:px-6">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">{item.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-[var(--heading)]">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
