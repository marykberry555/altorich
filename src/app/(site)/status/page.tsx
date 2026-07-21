import type { Metadata } from "next";
import Link from "next/link";
import { SystemStatusGrid } from "@/components/transparency/SystemStatusGrid";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/Button";
import { STATUS_PAGE, TRANSPARENCY_PAGE } from "@/content/transparency";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "System Status | Alto Rich",
    description: STATUS_PAGE.description,
    path: STATUS_PAGE.path
  }),
  description: STATUS_PAGE.description
};

export default function StatusPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Status", path: STATUS_PAGE.path }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar max-w-3xl">
          <PageHero
            eyebrow="Status"
            title={STATUS_PAGE.title}
            description={STATUS_PAGE.description}
          />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            For full transparency documentation, visit the{" "}
            <Link href={TRANSPARENCY_PAGE.path} className="font-semibold text-[var(--emerald)] hover:underline">
              Transparency Center
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar max-w-5xl">
          <SystemStatusGrid compact showOverall />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={TRANSPARENCY_PAGE.path}>
              <Button variant="outline">Transparency Center</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact support</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
