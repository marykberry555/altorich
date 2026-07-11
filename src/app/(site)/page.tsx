import { HomePage } from "@/components/marketing/HomePage";
import { buildMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import { COMPANY } from "@/lib/company";

export const metadata = buildMetadata({
  title: `${COMPANY.brand} — Premium wealth platform`,
  description:
    "Transparent cooperative wealth, structured investment plans, and verified member records. Trust, security, and long-term financial clarity.",
  path: "/",
  image: `${COMPANY.siteUrl}${BRAND.og.default}`
});

export default function Page() {
  return <HomePage />;
}
