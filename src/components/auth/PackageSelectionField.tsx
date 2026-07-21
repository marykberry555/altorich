"use client";

import type { PackageSlug } from "@/content/packages";
import { PortfolioSelector } from "@/components/portfolio/PortfolioSelector";

type Props = {
  value: PackageSlug | "";
  onChange: (slug: PackageSlug) => void;
  disabled?: boolean;
  error?: string;
};

/** @deprecated Prefer PortfolioSelector — retained for registration flow compatibility. */
export function PackageSelectionField(props: Props) {
  return <PortfolioSelector {...props} />;
}
