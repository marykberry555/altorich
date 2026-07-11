import type { PackageSlug } from "@/content/packages";
import type { ReferralProgramConfig } from "@/lib/referral/config";
import type { VipLevelConfig } from "@/lib/referral/types";

/** VIP level index → investment package slug (commission source in referral engine). */
export const VIP_PACKAGE_BY_LEVEL: PackageSlug[] = ["starter", "growth", "elite", "premium"];

/** Display badge names (Member → Gold). */
export const VIP_BADGE_BY_LEVEL = ["Member", "Bronze", "Silver", "Gold"] as const;

export type VipLevelState = "completed" | "current" | "locked";

export function getVipLevelState(level: number, currentLevel: number): VipLevelState {
  if (level < currentLevel) return "completed";
  if (level === currentLevel) return "current";
  return "locked";
}

export function getVipDisplayTitle(level: number, tierLabel: string) {
  const badge = VIP_BADGE_BY_LEVEL[level] ?? "VIP";
  return `${badge} (${tierLabel})`;
}

export function getVipBadgeLabel(level: number) {
  return VIP_BADGE_BY_LEVEL[level] ?? "VIP";
}

/**
 * Normalise VIP tiers for display — four canonical levels aligned with the referral engine.
 * Commission falls back to referral_program.commission_by_package when legacy DB rows are stale.
 */
export function normalizeReferralVipLevels(
  rows: VipLevelConfig[],
  config: ReferralProgramConfig
): VipLevelConfig[] {
  const sorted = [...rows].sort((a, b) => a.level - b.level);

  return VIP_PACKAGE_BY_LEVEL.map((slug, level) => {
    const row = sorted.find((r) => r.level === level) ?? sorted[level];
    const packageCommission = config.commission_by_package[slug];

    let commission = Number.isFinite(row?.commission_percent) ? Number(row!.commission_percent) : packageCommission;
    if (level > 0 && commission === 3 && packageCommission > 3) {
      commission = packageCommission;
    }

    return {
      level,
      label: row?.label ?? slug.charAt(0).toUpperCase() + slug.slice(1),
      min_members: row?.min_members ?? 0,
      commission_percent: commission,
      milestone_bonus: row?.milestone_bonus ?? 0,
      perks: row?.perks ?? []
    };
  });
}

export function buildVipBenefitLines(tier: VipLevelConfig) {
  const badge = getVipBadgeLabel(tier.level);
  const lines: string[] = [`${tier.commission_percent}% Referral Commission`, `${badge} Badge`];

  if (tier.milestone_bonus > 0) {
    lines.push("Milestone bonus at unlock");
  }

  for (const perk of tier.perks) {
    if (perk && !lines.some((l) => l.toLowerCase().includes(perk.toLowerCase().slice(0, 12)))) {
      lines.push(perk);
    }
  }

  return lines;
}

export function computeProgressToTarget(verifiedCount: number, target: number) {
  if (target <= 0) {
    return { progressPct: 100, remaining: 0, target, label: `${verifiedCount} Verified Investors` };
  }

  const progressPct = Math.min(100, Math.round((verifiedCount / target) * 100));
  const remaining = Math.max(0, target - verifiedCount);

  return {
    progressPct,
    remaining,
    target,
    label: `${verifiedCount} / ${target} Verified Investors`
  };
}
