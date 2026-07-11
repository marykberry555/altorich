import type { PackageSlug } from "@/lib/packages/package-config";
import { PACKAGE_CONFIG } from "@/lib/packages/package-config";

export type PreferredPackageOption = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
};

export const PREFERRED_PACKAGE_OPTIONS: PreferredPackageOption[] = PACKAGE_CONFIG.map((p) => ({
  slug: p.slug,
  title: p.title,
  subtitle: p.subtitle
}));

export function isPackageSlug(value: string): value is PackageSlug {
  return ["starter", "growth", "premium", "elite"].includes(value);
}

export function getPackageLabel(slug: string | null | undefined): string {
  if (!slug) return "Not Selected";
  const match = PREFERRED_PACKAGE_OPTIONS.find((p) => p.slug === slug);
  return match?.title ?? slug;
}
