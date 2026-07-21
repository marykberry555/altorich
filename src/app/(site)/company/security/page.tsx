import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { PublicSecurityCenterContent } from "@/components/trust/PublicSecurityCenterContent";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Security Center | Alto Rich",
  description: "How Alto Rich protects members — encryption, account security, transparency, and compliance.",
  path: "/company/security"
});

export default function PublicSecurityCenterPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Company", path: "/about" },
    { name: "Security Center", path: "/company/security" }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-3xl">
          <PageHero
            eyebrow="Security"
            title="Security Center"
            description="Institutional-grade protections, clear member controls, and transparent communication."
          />
        </div>
      </section>
      <section className="section-pad bg-section">
        <div className="container-ar max-w-5xl">
          <PublicSecurityCenterContent />
        </div>
      </section>
    </>
  );
}
