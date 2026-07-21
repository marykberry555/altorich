import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PACKAGE_CONFIG } from "@/lib/packages/package-config";
import { PACKAGE_IMAGES } from "@/lib/images";
import { PageHero } from "@/components/marketing/PageHero";
import { PackageCard } from "@/components/marketing/PackageCard";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import Image from "next/image";

export const metadata = buildMetadata({
  title: "Investment portfolios — Alto Rich",
  description:
    "Explore Alto Rich investment portfolios — professionally defined strategies with published investment ranges and settlement terms.",
  path: "/packages"
});

export default function PackagesIndexPage() {
  const portfolios = PACKAGE_CONFIG.map((pkg) => ({
    slug: pkg.slug,
    title: pkg.title,
    subtitle: pkg.subtitle,
    description: pkg.cardDescription,
    href: `/packages/${pkg.slug}`,
    image: pkg.image,
    keyBenefits: pkg.keyBenefits,
    bestFor: pkg.bestFor,
    ctaLabel: "View portfolio",
    dailyReturnPercent: pkg.dailyReturnPercent,
    minNgn: pkg.minNgn,
    maxNgn: pkg.maxNgn
  }));

  return (
    <>
      <section className="gradient-hero section-pad-hero">
        <div className="container-ar grid items-center gap-10 lg:grid-cols-2">
          <PageHero
            eyebrow="Investment portfolios"
            title="Professionally managed portfolios"
            description="Four defined investment portfolios — each with a primary strategy, published investment range, and transparent settlement process."
          />
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-lg)]">
            <Image
              src={PACKAGE_IMAGES.all.src}
              alt={PACKAGE_IMAGES.all.alt}
              width={800}
              height={520}
              className="h-[280px] w-full object-cover sm:h-[340px]"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:flex-row sm:items-center sm:p-6">
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              New to Alto Rich? Understand the member journey, how capital is allocated, and why settlements run weekly.
            </p>
            <Link href="/how-it-works" className="shrink-0">
              <Button variant="outline" size="sm" className="gap-2">
                How it works
                <ArrowRight size={14} aria-hidden />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {portfolios.map((pkg) => (
              <PackageCard key={pkg.slug} pkg={pkg} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
