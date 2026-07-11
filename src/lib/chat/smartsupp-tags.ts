import { getPackageLabel } from "@/lib/packages/constants";
import { VIP_PACKAGE_BY_LEVEL } from "@/lib/referral/vip-display";

export type SmartsuppVisitorRole = "guest" | "member" | "investor" | "admin";

export type SmartsuppTagInput = {
  role: SmartsuppVisitorRole;
  isAdmin?: boolean;
  hasActiveInvestment?: boolean;
  preferredPackageSlug?: string | null;
  vipLevel?: number | null;
};

function vipPackageTag(vipLevel: number): string | null {
  const slug = VIP_PACKAGE_BY_LEVEL[vipLevel];
  if (!slug) return null;
  const label = getPackageLabel(slug);
  return `VIP ${label}`;
}

function packageTag(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const label = getPackageLabel(slug);
  if (label === "Not Selected") return null;
  return `VIP ${label}`;
}

/** Build support-agent tags from existing profile/investment context. */
export function buildSmartsuppTags(input: SmartsuppTagInput): string[] {
  const tags = new Set<string>();

  if (input.isAdmin) tags.add("Admin");

  if (input.role === "guest") {
    tags.add("Guest");
    return [...tags];
  }

  tags.add("Member");

  if (input.hasActiveInvestment) tags.add("Investor");

  const vipTag = input.vipLevel != null ? vipPackageTag(input.vipLevel) : null;
  const preferredTag = packageTag(input.preferredPackageSlug);

  if (vipTag) tags.add(vipTag);
  else if (preferredTag) tags.add(preferredTag);

  return [...tags];
}
