import { HowItWorksPageContent } from "@/components/how-it-works/HowItWorksPageContent";
import { HOW_IT_WORKS_PAGE } from "@/content/how-it-works-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "How Alto Rich works — Member journey & operations",
  description:
    "Understand how Alto Rich operates: registration, portfolio selection, deposit verification, weekly settlements, and how to track your investment — explained clearly without hype.",
  path: HOW_IT_WORKS_PAGE.path
});

export default function HowItWorksPage() {
  return <HowItWorksPageContent />;
}
