import type { Metadata } from "next";
import { LeadershipPageContent } from "@/components/marketing/LeadershipPageContent";
import { EXECUTIVES, LEADERSHIP_PAGE } from "@/content/leadership";
import { LEADERSHIP_IMAGES } from "@/lib/leadership-images";
import { buildMetadata, breadcrumbJsonLd, leadershipPageJsonLd, organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Leadership & Governance | Alto Rich",
  description: LEADERSHIP_PAGE.hero.description,
  path: LEADERSHIP_PAGE.path
});

export default function LeadershipPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Leadership", path: LEADERSHIP_PAGE.path }
  ]);

  const organization = organizationJsonLd();

  const leadership = leadershipPageJsonLd(
    EXECUTIVES.map((exec) => ({
      name: exec.name,
      title: exec.title,
      intro: exec.intro,
      imageSrc: LEADERSHIP_IMAGES[exec.imageSlug as keyof typeof LEADERSHIP_IMAGES].variants.find(
        (v) => v.width === 800
      )!.src,
      office: exec.office
    }))
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(leadership) }} />
      <LeadershipPageContent />
    </>
  );
}
