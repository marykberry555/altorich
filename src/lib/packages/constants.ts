import type { PackageSlug } from "@/content/packages";
import { packageList } from "@/content/packages";

export type PreferredPackageOption = {
  slug: PackageSlug;
  title: string;
  subtitle: string;
};

export const PREFERRED_PACKAGE_OPTIONS: PreferredPackageOption[] = packageList.map((p) => ({
  slug: p.slug,
  title: p.title,
  subtitle: p.subtitle
}));

export function isPackageSlug(value: string): value is PackageSlug {
  return ["starter", "growth", "premium", "elite"].includes(value);
}

export function getPackageLabel(slug: string | null | undefined): string {
  if (!slug) return "Not selected";
  const match = PREFERRED_PACKAGE_OPTIONS.find((p) => p.slug === slug);
  return match?.title ?? slug;
}
