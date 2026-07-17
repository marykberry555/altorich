import Link from "next/link";
import { Crown } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getUserServices } from "@/lib/services";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VipLevelCardGrid } from "@/components/referral/VipLevelCardGrid";
import { VipProgressPanel } from "@/components/referral/VipProgressPanel";
import { DEFAULT_REFERRAL_PROGRAM } from "@/lib/referral/config";
import { getVipDisplayTitle, normalizeReferralVipLevels } from "@/lib/referral/vip-display";
import type { VipLevelConfig } from "@/lib/referral/types";

export const dynamic = "force-dynamic";

export default async function VipPage() {
  const user = await getSessionUser();
  const services = await getUserServices();

  if (!user || !services) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-[var(--text-muted)]">
        Sign in to view VIP tiers and your referral progress.
      </div>
    );
  }

  let vipLevels: VipLevelConfig[] = [];
  let currentLevel = 0;
  let verifiedCount = 0;
  let dataError: string | null = null;

  try {
    vipLevels = await services.referrals.listVipLevels();
  } catch (error) {
    dataError = error instanceof Error ? error.message : "Unable to load VIP tier configuration.";
    vipLevels = normalizeReferralVipLevels([], DEFAULT_REFERRAL_PROGRAM);
  }

  try {
    const { data: profile, error: profileError } = await services.supabase
      .from("profiles")
      .select("vip_level")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    currentLevel = profile?.vip_level ?? 0;
    verifiedCount = await services.referrals.countVerifiedReferrals(user.id);
  } catch (error) {
    if (!dataError) {
      dataError = error instanceof Error ? error.message : "Unable to load your VIP progress.";
    }
  }

  const current = vipLevels.find((v) => v.level === currentLevel) ?? vipLevels[0];
  const next = vipLevels.find((v) => v.level === currentLevel + 1) ?? null;
  const currentDisplayLabel = current ? getVipDisplayTitle(current.level, current.label) : "Member (Starter)";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--emerald)]">VIP programme</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--heading)] sm:text-3xl">Community growth tiers</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
          Share Alto Rich. Earn referral rewards as your network grows.
        </p>
      </header>

      {dataError ? (
        <div className="rounded-[var(--radius)] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="font-semibold">Some VIP data could not be loaded</p>
          <p className="mt-1 text-xs opacity-90">{dataError}</p>
        </div>
      ) : null}

      <Card variant="elevated" className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-[var(--navy-soft)] to-[var(--surface-raised)]">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-soft)] text-[var(--gold)]">
            <Crown size={28} />
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Your level</p>
            <p className="text-2xl font-bold text-[var(--heading)]">{currentDisplayLabel}</p>
            <p className="text-sm text-[var(--text-muted)]">{verifiedCount} verified investors</p>
          </div>
        </div>
        <Link href="/team">
          <Button>Open referral dashboard</Button>
        </Link>
      </Card>

      <VipProgressPanel
        currentLevel={currentLevel}
        currentLabel={currentDisplayLabel}
        currentCommission={current?.commission_percent ?? 0}
        verifiedCount={verifiedCount}
        nextTier={next}
      />

      <div>
        <h2 className="text-lg font-bold text-[var(--heading)]">All VIP levels</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Commission rates and milestones reflect your live platform configuration.
        </p>
        <VipLevelCardGrid tiers={vipLevels} currentLevel={currentLevel} className="mt-5" />
      </div>
    </div>
  );
}
