import type { Metadata } from "next";
import { TransparencyPageContent } from "@/components/transparency/TransparencyPageContent";
import { STATUS_PAGE, TRANSPARENCY_PAGE } from "@/content/transparency";
import { buildMetadata, breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Transparency Center | Alto Rich",
    description: TRANSPARENCY_PAGE.hero.description,
    path: TRANSPARENCY_PAGE.path
  }),
  description: TRANSPARENCY_PAGE.hero.description
};

export default function TransparencyPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Transparency", path: TRANSPARENCY_PAGE.path }
  ]);
  const organization = organizationJsonLd();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <TransparencyPageContent />
    </>
  );
}
