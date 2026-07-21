import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { ComplianceHubContent } from "@/components/trust/ComplianceHubContent";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Compliance Hub | Alto Rich",
  description: "Terms, privacy, AML, KYC, risk disclosure, and regulatory policies in one searchable library.",
  path: "/compliance"
});

export default function ComplianceHubPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Compliance Hub", path: "/compliance" }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-3xl">
          <PageHero
            eyebrow="Compliance"
            title="Compliance Hub"
            description="Policies, legal documents, and regulatory notices — searchable and clearly organised."
          />
        </div>
      </section>
      <section className="section-pad bg-section">
        <div className="container-ar max-w-5xl">
          <ComplianceHubContent />
        </div>
      </section>
    </>
  );
}
