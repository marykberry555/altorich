import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { IncidentBanner } from "@/components/trust/IncidentBanner";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <IncidentBanner />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
