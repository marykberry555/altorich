import type { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/AboutPageContent";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Alto Rich",
  description:
    "Building wealth with trust, not hype. Alto Rich helps everyday Nigerians invest through transparent sectors, published rules, and the Platform Earning Model.",
  path: "/about"
});

export default function AboutPage() {
  return <AboutPageContent />;
}
