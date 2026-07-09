import { MarketingLayout } from "@/components/layout/MarketingLayout";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
