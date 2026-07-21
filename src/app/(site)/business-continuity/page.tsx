import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { BusinessContinuityContent } from "@/components/trust/BusinessContinuityContent";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Business Continuity | Alto Rich",
  description: "Operational resilience, monitoring, backups, and incident communication at Alto Rich.",
  path: "/business-continuity"
});

export default function BusinessContinuityPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Business Continuity", path: "/business-continuity" }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-3xl">
          <PageHero
            eyebrow="Operations"
            title="Business continuity"
            description="How we maintain service availability, recover from incidents, and communicate with members."
          />
        </div>
      </section>
      <section className="section-pad bg-section">
        <div className="container-ar max-w-4xl">
          <BusinessContinuityContent />
        </div>
      </section>
    </>
  );
}
