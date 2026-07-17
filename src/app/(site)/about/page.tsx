import type { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/AboutPageContent";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: `About ${COMPANY.brand} | Nigerian Wealth Platform`,
  description:
    "Building wealth with trust, not hype. Alto Rich helps everyday Nigerians invest through transparent sectors, published rules, and the Platform Earning Model."
};

export default function AboutPage() {
  return <AboutPageContent />;
}
