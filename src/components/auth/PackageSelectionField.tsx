"use client";

import type { PackageSlug } from "@/content/packages";
import { PortfolioSelector } from "@/components/portfolio/PortfolioSelector";

type Props = {
  value: PackageSlug | "";
  onChange: (slug: PackageSlug) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
};

/** Registration package picker — labelled "Select package" for clarity. */
export function PackageSelectionField(props: Props) {
  return <PortfolioSelector {...props} />;
}
