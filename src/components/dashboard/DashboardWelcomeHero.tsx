import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MemberAvatar } from "@/components/profile/MemberAvatar";
import { getGreeting } from "@/lib/utils/avatar";
import { getPackageLabel } from "@/lib/packages/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Props = {
  fullName: string;
  avatarUrl?: string | null;
  preferredPackageSlug?: string | null;
  hasActiveInvestment: boolean;
};

export function DashboardWelcomeHero({ fullName, avatarUrl, preferredPackageSlug, hasActiveInvestment }: Props) {
  const name = fullName.trim() || "Member";
  const packageLabel = getPackageLabel(preferredPackageSlug);

  return (
    <Card variant="elevated" padding="none" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--emerald)]/8 via-transparent to-[var(--gold)]/5" aria-hidden />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <MemberAvatar fullName={name} avatarUrl={avatarUrl} size="lg" />
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">{getGreeting()}</p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">{name}</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Your wealth dashboard — naira-native, WAT-aligned, fully auditable.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:min-w-[240px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">
            {hasActiveInvestment ? "Active package" : "Preferred package"}
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--heading)]">{packageLabel}</p>
          {!hasActiveInvestment && preferredPackageSlug ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">Selected at sign-up — not yet funded.</p>
          ) : null}
          {!preferredPackageSlug ? (
            <p className="mt-1 text-xs text-[var(--text-muted)]">Choose a package in Settings.</p>
          ) : null}
          <Link href={preferredPackageSlug ? `/packages/${preferredPackageSlug}` : "/packages"} className="mt-3 inline-block">
            <Button size="sm" variant="outline" className="gap-1.5">
              {hasActiveInvestment ? "View investment" : "Fund this plan"}
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
