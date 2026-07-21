import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { OfficialSocialLinks } from "@/components/social/OfficialSocialLinks";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KnowledgeFaqCenter } from "@/components/knowledge/KnowledgeFaqCenter";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ Centre — Common questions",
  description:
    "Searchable answers on accounts, deposits, withdrawals, investments, welcome bonus, referrals, and security.",
  path: "/learn/faq"
});

export default function FaqPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Knowledge Center", path: "/learn" },
    { name: "FAQ", path: "/learn/faq" }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-3xl">
          <PageHero
            eyebrow="FAQ Centre"
            title="Answers when you need them"
            description="Search by topic or browse categories — straight answers on registration, funding, returns, and account security."
          />
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-3xl">
          <KnowledgeFaqCenter />

          <Card variant="outline" className="mt-10">
            <h2 className="font-semibold text-[var(--heading)]">Still need help?</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Browse the Knowledge Center for in-depth guides, or contact support for account-specific issues.
            </p>
            <OfficialSocialLinks className="mt-4" size="sm" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/learn">
                <Button variant="outline">Knowledge Center</Button>
              </Link>
              <Link href="/contact">
                <Button>Contact support</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
