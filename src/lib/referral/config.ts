import type { PackageSlug } from "@/lib/packages/package-config";
import { getReferralCommissionByPackage } from "@/lib/packages/package-config";

export type ReferralProgramConfig = {
  enabled: boolean;
  milestone_bonuses_enabled: boolean;
  recurring_commissions_enabled: boolean;
  min_payout_threshold: number;
  commission_by_package: Record<PackageSlug, number>;
};

export const DEFAULT_REFERRAL_PROGRAM: ReferralProgramConfig = {
  enabled: true,
  milestone_bonuses_enabled: true,
  recurring_commissions_enabled: false,
  min_payout_threshold: 5000,
  commission_by_package: getReferralCommissionByPackage(),
};

export function mergeReferralProgramConfig(
  partial: Partial<ReferralProgramConfig> | null | undefined
): ReferralProgramConfig {
  if (!partial) return DEFAULT_REFERRAL_PROGRAM;
  return {
    ...DEFAULT_REFERRAL_PROGRAM,
    ...partial,
    commission_by_package: {
      ...DEFAULT_REFERRAL_PROGRAM.commission_by_package,
      ...(partial.commission_by_package ?? {})
    }
  };
}

export type VipLevelConfig = {
  level: number;
  label: string;
  min_members: number;
  commission_percent: number;
  milestone_bonus: number;
  perks: string[];
};

export function resolvePackageCommissionRate(
  tier: string,
  config: ReferralProgramConfig,
  referrerVip?: Pick<VipLevelConfig, "commission_percent"> | null
) {
  const slug = tier as PackageSlug;
  const packageRate = config.commission_by_package[slug] ?? config.commission_by_package.starter;
  const vipRate = referrerVip?.commission_percent;
  if (vipRate == null) return packageRate;
  return Math.max(packageRate, vipRate);
}
